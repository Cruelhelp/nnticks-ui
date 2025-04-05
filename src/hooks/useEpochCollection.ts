import { useState, useEffect } from 'react';
import { epochCollectionService, EpochData } from '@/services/EpochCollectionService';

export function useEpochCollection() {
  const [epochs, setEpochs] = useState<EpochData[]>([]);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [isCollecting, setIsCollecting] = useState<boolean>(false);
  const [batchSize, setBatchSize] = useState<number>(100);
  
  useEffect(() => {
    // Load initial state
    const loadEpochs = async () => {
      const loadedEpochs = await epochCollectionService.getEpochs();
      setEpochs(loadedEpochs);
      setCurrentEpoch(epochCollectionService.getCurrentEpoch());
      setIsCollecting(epochCollectionService.isCollecting());
      setBatchSize(epochCollectionService.getBatchSize());
    };
    
    loadEpochs();
    
    // Subscribe to epoch events
    const handleEpochCompleted = (epoch: EpochData) => {
      setEpochs(prevEpochs => [...prevEpochs, epoch]);
      setCurrentEpoch(epochCollectionService.getCurrentEpoch());
    };
    
    const handleStatusChange = (collecting: boolean) => {
      setIsCollecting(collecting);
    };
    
    // Add event listeners
    epochCollectionService.on('epochCompleted', handleEpochCompleted);
    epochCollectionService.on('statusChange', handleStatusChange);
    
    // Clean up event listeners
    return () => {
      epochCollectionService.off('epochCompleted', handleEpochCompleted);
      epochCollectionService.off('statusChange', handleStatusChange);
    };
  }, []);
  
  const startCollection = async (newBatchSize: number) => {
    await epochCollectionService.startCollection(newBatchSize);
    setIsCollecting(true);
    setBatchSize(newBatchSize);
  };
  
  const stopCollection = async () => {
    await epochCollectionService.stopCollection();
    setIsCollecting(false);
  };
  
  const completeEpoch = async (results: { loss: number; accuracy: number; time: number }) => {
    await epochCollectionService.completeEpoch(currentEpoch, results);
    setCurrentEpoch(epochCollectionService.getCurrentEpoch());
  };
  
  const clearEpochs = async () => {
    await epochCollectionService.clearEpochs();
    setEpochs([]);
    setCurrentEpoch(0);
  };
  
  return {
    epochs,
    currentEpoch,
    isCollecting,
    batchSize,
    startCollection,
    stopCollection,
    completeEpoch,
    clearEpochs,
  };
}
