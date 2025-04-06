
import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { toast } from 'sonner';
import { TickData } from '@/types/chartTypes';

export interface EpochCollectionStatus {
  isActive: boolean;
  isProcessing: boolean;
  currentCount: number;
  targetCount: number;
  progress: number;
}

export function useEpochCollection() {
  const { user } = useAuth();
  const { latestTick, isConnected } = useWebSocket();
  const wsManagerRef = useRef<any>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [batchSize, setBatchSize] = useState(100);
  const [epochsCompleted, setEpochsCompleted] = useState(0);
  const [progress, setProgress] = useState(0);
  const [ticks, setTicks] = useState<TickData[]>([]);
  const [status, setStatus] = useState<EpochCollectionStatus | string>('idle');
  
  // Refs to maintain state across tab changes
  const isActiveRef = useRef(false);
  const batchSizeRef = useRef(100);
  const epochsCompletedRef = useRef(0);
  const ticksRef = useRef<TickData[]>([]);
  const currentCountRef = useRef(0);
  
  // Load persisted state from sessionStorage on mount
  useEffect(() => {
    try {
      const persistedState = sessionStorage.getItem('epochCollectionState');
      if (persistedState) {
        const state = JSON.parse(persistedState);
        setIsActive(state.isActive || false);
        setBatchSize(state.batchSize || 100);
        setEpochsCompleted(state.epochsCompleted || 0);
        setProgress(state.progress || 0);
        currentCountRef.current = state.currentCount || 0;
        
        isActiveRef.current = state.isActive || false;
        batchSizeRef.current = state.batchSize || 100;
        epochsCompletedRef.current = state.epochsCompleted || 0;
        
        // Update status based on the persisted state
        updateStatus();
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading persisted state:', error);
      setIsInitialized(true);
    }
  }, []);
  
  // Also load from Supabase if the user is logged in
  useEffect(() => {
    if (user) {
      loadStateFromSupabase();
    }
  }, [user]);
  
  // Update status object
  const updateStatus = useCallback(() => {
    setStatus({
      isActive: isActiveRef.current,
      isProcessing: false,
      currentCount: currentCountRef.current,
      targetCount: batchSizeRef.current,
      progress: (currentCountRef.current / batchSizeRef.current) * 100
    });
    
    setProgress((currentCountRef.current / batchSizeRef.current) * 100);
  }, []);
  
  // Save state to sessionStorage and Supabase whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    
    const state = {
      isActive,
      batchSize,
      epochsCompleted,
      progress,
      currentCount: currentCountRef.current,
    };
    
    // Update refs
    isActiveRef.current = isActive;
    batchSizeRef.current = batchSize;
    epochsCompletedRef.current = epochsCompleted;
    
    // Save to sessionStorage
    sessionStorage.setItem('epochCollectionState', JSON.stringify(state));
    
    // Also save to Supabase if user is logged in
    if (user) {
      saveStateToSupabase(state);
    }
  }, [isActive, batchSize, epochsCompleted, progress, isInitialized, user]);
  
  // Load state from Supabase
  const loadStateFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('epoch_collection_state')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error loading state from Supabase:', error);
        return;
      }
      
      if (data) {
        setIsActive(data.is_active);
        setBatchSize(data.batch_size);
        setEpochsCompleted(data.epochs_completed);
        currentCountRef.current = data.current_count;
        
        isActiveRef.current = data.is_active;
        batchSizeRef.current = data.batch_size;
        epochsCompletedRef.current = data.epochs_completed;
        
        updateStatus();
      }
    } catch (error) {
      console.error('Error loading state from Supabase:', error);
    }
  };
  
  // Save state to Supabase
  const saveStateToSupabase = async (state: any) => {
    try {
      const { error } = await supabase
        .from('epoch_collection_state')
        .upsert({
          user_id: user.id,
          is_active: state.isActive,
          batch_size: state.batchSize,
          epochs_completed: state.epochsCompleted,
          current_count: state.currentCount,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
        
      if (error) {
        console.error('Error saving state to Supabase:', error);
      }
    } catch (error) {
      console.error('Error saving state to Supabase:', error);
    }
  };
  
  // Process tick data
  useEffect(() => {
    if (!isInitialized || !isActiveRef.current || !latestTick) return;
    
    // Add the tick to the collection
    ticksRef.current = [...ticksRef.current, latestTick];
    currentCountRef.current += 1;
    
    // Update state and UI
    updateStatus();
    
    // Check if we've reached the target batch size
    if (currentCountRef.current >= batchSizeRef.current) {
      processEpoch();
    }
  }, [latestTick, isInitialized, updateStatus]);
  
  // Process an epoch
  const processEpoch = async () => {
    if (ticksRef.current.length < batchSizeRef.current) {
      return; // Not enough ticks yet
    }
    
    // Update status to processing
    setStatus(prev => typeof prev === 'object' ? { ...prev, isProcessing: true } : prev);
    
    try {
      // Extract price values from ticks
      const priceValues = ticksRef.current.map(tick => tick.value);
      
      // Train the neural network
      const trainingResult = await neuralNetwork.train(priceValues, { 
        maxEpochs: 10,
        onProgress: (progress) => console.log(`Training progress: ${progress * 100}%`)
      });
      
      // Save the completed epoch
      if (user) {
        await saveEpochToSupabase(ticksRef.current, trainingResult);
      }
      
      // Update epoch count
      const newEpochCount = epochsCompletedRef.current + 1;
      epochsCompletedRef.current = newEpochCount;
      setEpochsCompleted(newEpochCount);
      
      // Reset tick collection
      ticksRef.current = [];
      currentCountRef.current = 0;
      
      // Update status
      updateStatus();
      
      console.log(`Epoch ${newEpochCount} completed. Neural network trained with accuracy: ${trainingResult.accuracy}`);
    } catch (error) {
      console.error('Error processing epoch:', error);
      toast.error('Failed to process epoch');
    } finally {
      // Update status
      setStatus(prev => typeof prev === 'object' ? { ...prev, isProcessing: false } : prev);
    }
  };
  
  // Save epoch data to Supabase
  const saveEpochToSupabase = async (epochTicks: TickData[], trainingResult: any) => {
    try {
      // Get timestamps from first and last tick
      const startTime = epochTicks[0].timestamp;
      const endTime = epochTicks[epochTicks.length - 1].timestamp;
      
      // Calculate duration in milliseconds
      const duration = typeof endTime === 'string' && typeof startTime === 'string'
        ? new Date(endTime).getTime() - new Date(startTime).getTime()
        : Number(endTime) - Number(startTime);
        
      // Extract neural network metrics
      const accuracy = trainingResult.accuracy || 0;
      const loss = neuralNetwork.getLastLoss() || 0;
      
      // Create a proper TrainingResult object
      const result = {
        missionId: 0, // Default value for automated training
        epochs: 1,
        accuracy: accuracy,
        points: 0,
        modelData: neuralNetwork.exportModel()
      };
      
      // Save to Supabase
      const { error } = await supabase
        .from('epochs')
        .insert({
          user_id: user.id,
          epoch_number: epochsCompleted + 1,
          batch_size: batchSize,
          start_time: new Date(Number(startTime)).toISOString(),
          end_time: new Date(Number(endTime)).toISOString(),
          duration_ms: duration,
          accuracy: accuracy * 100, // Convert to percentage
          loss: loss,
          training_result: result,
          created_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Error saving epoch to Supabase:', error);
      }
    } catch (error) {
      console.error('Error saving epoch to Supabase:', error);
    }
  };
  
  // Start collection
  const startCollection = async () => {
    if (!isConnected) {
      toast.error('WebSocket not connected. Cannot collect ticks.');
      return false;
    }
    
    setIsActive(true);
    isActiveRef.current = true;
    updateStatus();
    toast.success('Epoch collection started');
    return true;
  };
  
  // Stop collection
  const stopCollection = () => {
    setIsActive(false);
    isActiveRef.current = false;
    updateStatus();
    toast.info('Epoch collection paused');
  };
  
  // Reset collection
  const resetCollection = () => {
    setTicks([]);
    ticksRef.current = [];
    currentCountRef.current = 0;
    setProgress(0);
    updateStatus();
    toast.info('Epoch collection reset');
  };
  
  // Update batch size
  const updateBatchSize = async (newSize: number) => {
    if (isNaN(newSize) || newSize < 10) {
      toast.error('Batch size must be at least 10');
      return false;
    }
    
    setBatchSize(newSize);
    batchSizeRef.current = newSize;
    updateStatus();
    toast.success(`Batch size updated to ${newSize}`);
    return true;
  };
  
  return {
    status,
    batchSize,
    isInitialized,
    isActive,
    progress,
    epochsCompleted,
    startCollection,
    stopCollection,
    resetCollection,
    updateBatchSize
  };
}
