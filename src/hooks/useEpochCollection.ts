
import { useState, useEffect, useCallback, useRef } from 'react';
import { epochCollectionService, EpochData, ModelTrainingResults } from '@/services/EpochCollectionService';
import { useWebSocket } from '@/hooks/useWebSocket';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { TrainingResult, TickData } from '@/types/chartTypes';

interface EpochStatus {
  isProcessing: boolean;
  currentCount: number;
  latestResults?: ModelTrainingResults;
}

// Define a new interface for persistent state
interface PersistentEpochState {
  isActive: boolean;
  progress: number;
  currentCount: number;
  epochsCompleted: number;
  batchSize: number;
  lastUpdated: number;
}

const PERSISTENT_STATE_KEY = 'epochCollectionState';

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
  
  const tickBufferRef = useRef<TickData[]>([]);
  const { user } = useAuth();
  const socket = useWebSocket();
  
  // Load persistent state from localStorage on init
  const loadPersistentState = useCallback(() => {
    try {
      const savedState = localStorage.getItem(PERSISTENT_STATE_KEY);
      if (savedState) {
        const parsedState: PersistentEpochState = JSON.parse(savedState);
        
        // Check if the state is still valid (less than 24 hours old)
        const now = Date.now();
        const lastUpdated = parsedState.lastUpdated || 0;
        const isStateValid = (now - lastUpdated) < 86400000; // 24 hours
        
        if (isStateValid) {
          setBatchSize(parsedState.batchSize);
          setEpochsCompleted(parsedState.epochsCompleted);
          setIsActive(parsedState.isActive);
          setProgress(parsedState.progress);
          setStatus(prev => ({
            ...prev,
            currentCount: parsedState.currentCount || 0
          }));
          
          // Also update the service state
          epochCollectionService.setBatchSize(parsedState.batchSize);
          if (parsedState.epochsCompleted > epochCollectionService.getCurrentEpoch()) {
            // Sync the epochCollectionService with our stored state
            epochCollectionService.setCurrentEpoch(parsedState.epochsCompleted);
          }
          epochCollectionService.updateProgress(parsedState.progress);
        }
      }
    } catch (error) {
      console.error('Error loading persistent epoch state:', error);
    }
  }, []);
  
  // Save current state to both localStorage and Supabase
  const savePersistentState = useCallback(() => {
    const stateToSave: PersistentEpochState = {
      isActive,
      progress,
      currentCount: status.currentCount,
      epochsCompleted,
      batchSize,
      lastUpdated: Date.now()
    };
    
    // Save to localStorage
    try {
      localStorage.setItem(PERSISTENT_STATE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving epoch state to localStorage:', error);
    }
    
    // Save to Supabase if user is logged in
    if (user) {
      saveStateToSupabase(stateToSave).catch(e => 
        console.error('Error saving epoch state to Supabase:', e)
      );
    }
  }, [isActive, progress, status.currentCount, epochsCompleted, batchSize, user]);
  
  // Save state to Supabase
  const saveStateToSupabase = async (state: PersistentEpochState) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('tick_collection_settings')
        .upsert({
          user_id: user.id,
          batch_size: state.batchSize,
          enabled: state.isActive,
          last_updated: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
    } catch (error) {
      console.error('Failed to save tick collection settings to Supabase:', error);
    }
  };
  
  // Load state from Supabase
  const loadStateFromSupabase = async () => {
    if (!user) return;
    
    try {
      // First load settings
      const { data: settings, error: settingsError } = await supabase
        .from('tick_collection_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }
      
      if (settings) {
        setBatchSize(settings.batch_size);
        setIsActive(settings.enabled);
        epochCollectionService.setBatchSize(settings.batch_size);
      }
      
      // Then load last epoch count from epochs table
      const { data: lastEpoch, error: epochError } = await supabase
        .from('epochs')
        .select('epoch_number')
        .eq('user_id', user.id)
        .order('epoch_number', { ascending: false })
        .limit(1)
        .single();
      
      if (epochError && epochError.code !== 'PGRST116') {
        throw epochError;
      }
      
      if (lastEpoch) {
        const epochNumber = lastEpoch.epoch_number;
        setEpochsCompleted(epochNumber);
        epochCollectionService.setCurrentEpoch(epochNumber);
      }
      
    } catch (error) {
      console.error('Error loading settings from Supabase:', error);
    }
  };
  
  // Initialize from the service and persistent storage
  useEffect(() => {
    // First load from localStorage
    loadPersistentState();
    
    // Then from epochCollectionService
    setBatchSize(epochCollectionService.getBatchSize());
    setEpochsCompleted(epochCollectionService.getCurrentEpoch());
    setIsActive(epochCollectionService.isCollecting());
    setProgress(epochCollectionService.getProgress());
    
    // Finally try to load from Supabase (this may override other sources)
    if (user) {
      loadStateFromSupabase();
    }
    
    setIsInitialized(true);
    
    // Set up event listeners
    const handleProgress = (progress: number) => {
      setProgress(progress);
      setStatus(prev => ({
        ...prev,
        currentCount: Math.floor((progress / 100) * batchSize)
      }));
      
      // Save state on progress updates
      savePersistentState();
    };
    
    const handleStatusChange = (isCollecting: boolean) => {
      setIsActive(isCollecting);
      
      // Save state on status changes
      savePersistentState();
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
      
      // Save state on epoch completion
      savePersistentState();
    };
    
    epochCollectionService.on('progress', handleProgress);
    epochCollectionService.on('statusChange', handleStatusChange);
    epochCollectionService.on('epochCompleted', handleEpochCompleted);
    
    return () => {
      epochCollectionService.off('progress', handleProgress);
      epochCollectionService.off('statusChange', handleStatusChange);
      epochCollectionService.off('epochCompleted', handleEpochCompleted);
    };
  }, [batchSize, loadPersistentState, savePersistentState, user]);
  
  // Effect for periodic state persistence
  useEffect(() => {
    // Save state every 10 seconds if active
    const intervalId = setInterval(() => {
      if (isActive) {
        savePersistentState();
      }
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [isActive, savePersistentState]);
  
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
    
    // Update Supabase with the active state
    if (user) {
      saveStateToSupabase({
        isActive: true,
        progress: 0,
        currentCount: 0,
        epochsCompleted,
        batchSize,
        lastUpdated: Date.now()
      });
    }
    
    // Buffer to store received ticks
    tickBufferRef.current = [];
    
    // Start collecting ticks
    const ticksProcessor = (tick: any) => {
      if (!isActive || !epochCollectionService.isCollecting()) return;
      
      // Add tick to buffer
      tickBufferRef.current.push(tick);
      
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
      const ticks = tickBufferRef.current.length > 0 
        ? tickBufferRef.current 
        : socket.getBufferedTicks?.() || [];
      
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
        // Properly convert number to TrainingResult type
        const accuracy = await neuralNetwork.train(tickValues);
        const trainingResult: TrainingResult = {
          loss: neuralNetwork.getLastLoss(),
          accuracy: accuracy
        };
        
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
        tickBufferRef.current = [];
        socket.clearBuffer?.();
        epochCollectionService.startNewEpoch();
        
        toast.success('Epoch completed and model trained');
      } catch (error) {
        console.error('Error processing epoch:', error);
        toast.error('Error training model with epoch data');
        stopCollection();
      }
    };
    
    // Return cleanup function
    return () => {
      socket.off('tick', ticksProcessor);
    };
  }, [user, socket, batchSize, progress, isActive, epochsCompleted]);
  
  // Stop collecting ticks
  const stopCollection = useCallback(() => {
    socket.off('tick', () => {}); // This is a placeholder, actual handlers are removed in the startCollection return function
    setIsActive(false);
    setProgress(0);
    setStatus(prev => ({ ...prev, isProcessing: false, currentCount: 0 }));
    toast.info('Epoch collection paused');
    
    // Update Supabase with the inactive state
    if (user) {
      saveStateToSupabase({
        isActive: false,
        progress: 0,
        currentCount: 0,
        epochsCompleted,
        batchSize,
        lastUpdated: Date.now()
      });
    }
  }, [socket, epochsCompleted, batchSize, user]);
  
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
    
    // Clear persistent state
    localStorage.removeItem(PERSISTENT_STATE_KEY);
    
    // Update Supabase if user is logged in
    if (user) {
      saveStateToSupabase({
        isActive: false,
        progress: 0,
        currentCount: 0,
        epochsCompleted: 0,
        batchSize,
        lastUpdated: Date.now()
      });
    }
  }, [stopCollection, batchSize, user]);
  
  // Update batch size
  const updateBatchSize = useCallback(async (newSize: number) => {
    if (newSize < 10 || newSize > 1000) {
      toast.error('Batch size must be between 10 and 1000');
      return;
    }
    
    epochCollectionService.setBatchSize(newSize);
    setBatchSize(newSize);
    toast.success(`Batch size updated to ${newSize}`);
    
    // Update persistent state
    savePersistentState();
    
    // Update Supabase if user is logged in
    if (user) {
      saveStateToSupabase({
        isActive,
        progress,
        currentCount: status.currentCount,
        epochsCompleted,
        batchSize: newSize,
        lastUpdated: Date.now()
      });
    }
  }, [isActive, progress, status.currentCount, epochsCompleted, user, savePersistentState]);
  
  // Save epoch data to Supabase
  const saveEpochToSupabase = async (
    epochNumber: number,
    results: ModelTrainingResults,
    tickValues: number[]
  ) => {
    try {
      // Save model state
      const modelState = neuralNetwork.exportModel();
      
      // Save epoch data
      const { error } = await supabase.from('epochs').insert({
        user_id: user!.id,
        epoch_number: epochNumber,
        batch_size: batchSize,
        loss: results.loss,
        accuracy: results.accuracy,
        training_time: results.time,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        model_state: modelState
      });
      
      if (error) {
        console.error('Error saving epoch to Supabase:', error);
        return;
      }
      
      // Also save the ticks for this epoch
      const { error: ticksError } = await supabase.from('epoch_ticks').insert({
        epoch_id: epochNumber,
        ticks: tickValues
      });
      
      if (ticksError) {
        console.error('Error saving epoch ticks to Supabase:', ticksError);
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
