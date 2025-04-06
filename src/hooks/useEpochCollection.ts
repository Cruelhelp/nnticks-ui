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
  
  const isActiveRef = useRef(false);
  const batchSizeRef = useRef(100);
  const epochsCompletedRef = useRef(0);
  const ticksRef = useRef<TickData[]>([]);
  const currentCountRef = useRef(0);
  
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
        
        updateStatus();
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading persisted state:', error);
      setIsInitialized(true);
    }
  }, []);
  
  useEffect(() => {
    if (user) {
      loadStateFromSupabase();
    }
  }, [user]);
  
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
  
  useEffect(() => {
    if (!isInitialized) return;
    
    const state = {
      isActive,
      batchSize,
      epochsCompleted,
      progress,
      currentCount: currentCountRef.current,
    };
    
    isActiveRef.current = isActive;
    batchSizeRef.current = batchSize;
    epochsCompletedRef.current = epochsCompleted;
    
    sessionStorage.setItem('epochCollectionState', JSON.stringify(state));
    
    if (user) {
      saveStateToSupabase(state);
    }
  }, [isActive, batchSize, epochsCompleted, progress, isInitialized, user]);
  
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
  
  useEffect(() => {
    if (!isInitialized || !isActiveRef.current || !latestTick) return;
    
    ticksRef.current = [...ticksRef.current, latestTick];
    currentCountRef.current += 1;
    
    updateStatus();
    
    if (currentCountRef.current >= batchSizeRef.current) {
      processEpoch();
    }
  }, [latestTick, isInitialized, updateStatus]);
  
  const processEpoch = async () => {
    if (ticksRef.current.length < batchSizeRef.current) {
      return; // Not enough ticks yet
    }
    
    setStatus(prev => typeof prev === 'object' ? { ...prev, isProcessing: true } : prev);
    
    try {
      const priceValues = ticksRef.current.map(tick => tick.value);
      
      const trainingResult = await neuralNetwork.train(priceValues, { 
        maxEpochs: 10,
        onProgress: (progress) => console.log(`Training progress: ${progress * 100}%`)
      });
      
      if (user) {
        await saveEpochToSupabase(ticksRef.current, trainingResult);
      }
      
      const newEpochCount = epochsCompletedRef.current + 1;
      epochsCompletedRef.current = newEpochCount;
      setEpochsCompleted(newEpochCount);
      
      ticksRef.current = [];
      currentCountRef.current = 0;
      
      updateStatus();
      
      console.log(`Epoch ${newEpochCount} completed. Neural network trained with accuracy: ${trainingResult * 100}%`);
    } catch (error) {
      console.error('Error processing epoch:', error);
      toast.error('Failed to process epoch');
    } finally {
      setStatus(prev => typeof prev === 'object' ? { ...prev, isProcessing: false } : prev);
    }
  };
  
  const saveEpochToSupabase = async (epochTicks: TickData[], trainingResult: any) => {
    try {
      const startTime = epochTicks[0].timestamp;
      const endTime = epochTicks[epochTicks.length - 1].timestamp;
      
      const duration = typeof endTime === 'string' && typeof startTime === 'string'
        ? new Date(endTime).getTime() - new Date(startTime).getTime()
        : Number(endTime) - Number(startTime);
        
      const accuracy = trainingResult.accuracy || 0;
      const loss = neuralNetwork.getLastLoss() || 0;
      
      const result = {
        missionId: 0,
        epochs: 1,
        accuracy: accuracy,
        points: 0,
        modelData: neuralNetwork.exportModel()
      };
      
      const { error } = await supabase
        .from('epochs')
        .insert({
          user_id: user.id,
          epoch_number: epochsCompleted + 1,
          batch_size: batchSize,
          start_time: new Date(Number(startTime)).toISOString(),
          end_time: new Date(Number(endTime)).toISOString(),
          duration_ms: duration,
          accuracy: accuracy * 100,
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
  
  const stopCollection = () => {
    setIsActive(false);
    isActiveRef.current = false;
    updateStatus();
    toast.info('Epoch collection paused');
  };
  
  const resetCollection = () => {
    setTicks([]);
    ticksRef.current = [];
    currentCountRef.current = 0;
    setProgress(0);
    updateStatus();
    toast.info('Epoch collection reset');
  };
  
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
