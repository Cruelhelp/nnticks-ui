
import { useState, useEffect } from 'react';
import { epochCollectionService, EpochData } from '@/services/EpochCollectionService';

export function useEpochCollection() {
  const [epochs, setEpochs] = useState<EpochData[]>([]);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [isCollecting, setIsCollecting] = useState<boolean>(false);
  const [batchSize, setBatchSize] = useState<number>(100);
  const [status, setStatus] = useState<string>('idle');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [epochsCompleted, setEpochsCompleted] = useState<number>(0);
  
  useEffect(() => {
    // Load initial state
    const loadEpochs = async () => {
      const loadedEpochs = await epochCollectionService.getEpochs();
      setEpochs(loadedEpochs);
      setCurrentEpoch(epochCollectionService.getCurrentEpoch());
      setIsCollecting(epochCollectionService.isCollecting());
      setBatchSize(epochCollectionService.getBatchSize());
      setIsInitialized(true);
      setEpochsCompleted(loadedEpochs.filter(e => e.endTime).length);
      setStatus(epochCollectionService.isCollecting() ? 'collecting' : 'idle');
    };
    
    loadEpochs();
    
    // Subscribe to epoch events
    const handleEpochCompleted = (epoch: EpochData) => {
      setEpochs(prevEpochs => [...prevEpochs, epoch]);
      setCurrentEpoch(epochCollectionService.getCurrentEpoch());
      setEpochsCompleted(prev => prev + 1);
      setProgress(0);
    };
    
    const handleStatusChange = (collecting: boolean) => {
      setIsCollecting(collecting);
      setStatus(collecting ? 'collecting' : 'idle');
      setIsActive(collecting);
    };
    
    const handleProgress = (progress: number) => {
      setProgress(progress);
    };
    
    // Add event listeners
    epochCollectionService.on('epochCompleted', handleEpochCompleted);
    epochCollectionService.on('statusChange', handleStatusChange);
    epochCollectionService.on('progress', handleProgress);
    
    // Clean up event listeners
    return () => {
      epochCollectionService.off('epochCompleted', handleEpochCompleted);
      epochCollectionService.off('statusChange', handleStatusChange);
      epochCollectionService.off('progress', handleProgress);
    };
  }, []);
  
  const startCollection = async (newBatchSize: number) => {
    setStatus('initializing');
    await epochCollectionService.startNewEpoch();
    setIsCollecting(true);
    setIsActive(true);
    setBatchSize(newBatchSize);
    epochCollectionService.setBatchSize(newBatchSize);
    setStatus('collecting');
  };
  
  const stopCollection = async () => {
    setStatus('stopping');
    await epochCollectionService.completeEpoch(currentEpoch, {
      loss: 0,
      accuracy: 0,
      time: 0
    });
    setIsCollecting(false);
    setIsActive(false);
    setStatus('idle');
  };
  
  const completeEpoch = async (results: { loss: number; accuracy: number; time: number }) => {
    setStatus('completing');
    await epochCollectionService.completeEpoch(currentEpoch, results);
    setCurrentEpoch(epochCollectionService.getCurrentEpoch());
    setStatus('idle');
  };
  
  const clearEpochs = async () => {
    setStatus('clearing');
    // Create a new method in the service to clear epochs
    await epochCollectionService.clearEpochs();
    setEpochs([]);
    setCurrentEpoch(0);
    setEpochsCompleted(0);
    setStatus('idle');
  };
  
  const resetCollection = async () => {
    setStatus('resetting');
    await clearEpochs();
    setStatus('idle');
  };
  
  const updateBatchSize = (size: number) => {
    setBatchSize(size);
    epochCollectionService.setBatchSize(size);
  };
  
  return {
    epochs,
    currentEpoch,
    isCollecting,
    batchSize,
    status,
    isInitialized,
    isActive,
    progress,
    epochsCompleted,
    startCollection,
    stopCollection,
    completeEpoch,
    clearEpochs,
    resetCollection,
    updateBatchSize
  };
}
