
import { useState, useEffect, useCallback } from 'react';
import { epochCollectionService, EpochData, ModelTrainingResults } from '@/services/EpochCollectionService';
import { useWebSocket } from '@/hooks/useWebSocket';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface EpochStatus {
  isProcessing: boolean;
  currentCount: number;
  latestResults?: ModelTrainingResults;
}

export function useEpochCollection() {
  const [isActive, setIsActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchSize, setBatchSize] = useState(100);
  const [epochsCompleted, setEpochsCompleted] = useState(0);
  const [status, setStatus] = useState<EpochStatus>({
    isProcessing: false,
    currentCount: 0,
    latestResults: undefined
  });
  
  const { user } = useAuth();
  const socket = useWebSocket();
  
  // Initialize from the service
  useEffect(() => {
    setBatchSize(epochCollectionService.getBatchSize());
    setEpochsCompleted(epochCollectionService.getCurrentEpoch());
    setIsActive(epochCollectionService.isCollecting());
    setProgress(epochCollectionService.getProgress());
    setIsInitialized(true);
    
    // Set up event listeners
    const handleProgress = (progress: number) => {
      setProgress(progress);
      setStatus(prev => ({
        ...prev,
        currentCount: Math.floor((progress / 100) * batchSize)
      }));
    };
    
    const handleStatusChange = (isCollecting: boolean) => {
      setIsActive(isCollecting);
    };
    
    const handleEpochCompleted = (epoch: EpochData) => {
      setEpochsCompleted(epochCollectionService.getCurrentEpoch());
      if (epoch.results) {
        setStatus(prev => ({
          ...prev,
          latestResults: epoch.results,
          isProcessing: false
        }));
      }
    };
    
    epochCollectionService.on('progress', handleProgress);
    epochCollectionService.on('statusChange', handleStatusChange);
    epochCollectionService.on('epochCompleted', handleEpochCompleted);
    
    return () => {
      epochCollectionService.off('progress', handleProgress);
      epochCollectionService.off('statusChange', handleStatusChange);
      epochCollectionService.off('epochCompleted', handleEpochCompleted);
    };
  }, [batchSize]);
  
  // Start collecting ticks
  const startCollection = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to start epoch collection');
      return;
    }
    
    if (!socket.isConnected) {
      toast.error('WebSocket not connected. Please wait for connection.');
      return;
    }
    
    setStatus(prev => ({ ...prev, isProcessing: false, currentCount: 0 }));
    setProgress(0);
    epochCollectionService.startNewEpoch();
    setIsActive(true);
    
    // Start collecting ticks
    const ticksProcessor = (tick: any) => {
      if (!epochCollectionService.isCollecting()) return;
      
      // Update progress
      const currentProgress = Math.min(
        progress + (1 / batchSize) * 100,
        99.9
      );
      
      setProgress(currentProgress);
      epochCollectionService.updateProgress(currentProgress);
      
      setStatus(prev => ({
        ...prev,
        currentCount: Math.floor((currentProgress / 100) * batchSize)
      }));
      
      // If we've collected enough ticks, process the epoch
      if (currentProgress >= 99.9) {
        completeEpoch();
      }
    };
    
    // Register tick handler
    socket.on('tick', ticksProcessor);
    
    // Store the handler so we can remove it later
    const completeEpoch = async () => {
      if (!epochCollectionService.isCollecting()) return;
      
      // Indicate processing
      setStatus(prev => ({ ...prev, isProcessing: true }));
      
      // Get ticks to train on
      const ticks = socket.getBufferedTicks?.() || [];
      
      if (ticks.length < batchSize) {
        toast.error(`Not enough ticks collected: ${ticks.length}/${batchSize}`);
        stopCollection();
        return;
      }
      
      try {
        // Train the model with the collected ticks
        const startTime = performance.now();
        const tickValues = ticks.slice(-batchSize).map(t => t.value);
        
        // Train the neural network with this batch
        const trainingResult = await neuralNetwork.train(tickValues);
        
        const endTime = performance.now();
        const trainingTime = endTime - startTime;
        
        // Save the epoch results
        const epochResults: ModelTrainingResults = {
          loss: trainingResult.loss || 0,
          accuracy: trainingResult.accuracy || 0,
          time: trainingTime
        };
        
        // Complete the epoch in the service
        const currentEpoch = epochCollectionService.getCurrentEpoch();
        await epochCollectionService.completeEpoch(currentEpoch, epochResults);
        
        // Save to Supabase if user is logged in
        if (user) {
          saveEpochToSupabase(currentEpoch, epochResults, tickValues);
        }
        
        // Reset progress and start a new epoch
        setProgress(0);
        socket.clearBuffer?.();
        epochCollectionService.startNewEpoch();
        
        toast.success('Epoch completed and model trained');
      } catch (error) {
        console.error('Error processing epoch:', error);
        toast.error('Error training model with epoch data');
        stopCollection();
      }
    };
    
    return () => {
      // Clean up
      socket.off('tick', ticksProcessor);
    };
  }, [user, socket, batchSize, progress]);
  
  // Stop collecting ticks
  const stopCollection = useCallback(() => {
    socket.off('tick');
    setIsActive(false);
    setProgress(0);
    setStatus(prev => ({ ...prev, isProcessing: false, currentCount: 0 }));
    toast.info('Epoch collection paused');
  }, [socket]);
  
  // Reset collection state
  const resetCollection = useCallback(() => {
    if (!window.confirm('Are you sure you want to reset all epoch data?')) {
      return;
    }
    
    stopCollection();
    epochCollectionService.clearEpochs();
    setEpochsCompleted(0);
    setProgress(0);
    setStatus({ isProcessing: false, currentCount: 0 });
    toast.success('Epoch collection reset');
  }, [stopCollection]);
  
  // Update batch size
  const updateBatchSize = useCallback(async (newSize: number) => {
    if (newSize < 10 || newSize > 1000) {
      toast.error('Batch size must be between 10 and 1000');
      return;
    }
    
    epochCollectionService.setBatchSize(newSize);
    setBatchSize(newSize);
    toast.success(`Batch size updated to ${newSize}`);
  }, []);
  
  // Save epoch data to Supabase
  const saveEpochToSupabase = async (
    epochNumber: number,
    results: ModelTrainingResults,
    tickValues: number[]
  ) => {
    try {
      const { error } = await supabase.from('epochs').insert({
        user_id: user!.id,
        epoch_number: epochNumber,
        batch_size: batchSize,
        loss: results.loss,
        accuracy: results.accuracy,
        training_time: results.time,
        created_at: new Date().toISOString(),
        tick_data: JSON.stringify(tickValues)
      });
      
      if (error) {
        console.error('Error saving epoch to Supabase:', error);
      }
    } catch (error) {
      console.error('Failed to save epoch to Supabase:', error);
    }
  };
  
  return {
    status,
    isActive,
    isInitialized,
    progress,
    batchSize,
    epochsCompleted,
    startCollection,
    stopCollection,
    resetCollection,
    updateBatchSize
  };
}
