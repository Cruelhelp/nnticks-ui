
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { epochCollectionService } from '@/services/EpochCollectionService';
import { EpochCollectionStatus, EpochData } from '@/types/chartTypes';
import { persistentWebSocket } from '@/services/PersistentWebSocketService';

export function useEpochCollection() {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<EpochCollectionStatus>(epochCollectionService.getStatus());
  const [batchSize, setBatchSize] = useState(epochCollectionService.getBatchSize());
  const [epochsCompleted, setEpochsCompleted] = useState(epochCollectionService.getCurrentEpochCount());
  const [epochs, setEpochs] = useState<EpochData[]>(epochCollectionService.getEpochs());
  const [isConnected, setIsConnected] = useState(persistentWebSocket.isConnected());
  
  // Initialize service when user is available
  useEffect(() => {
    epochCollectionService.init(user?.id || null);
    setIsInitialized(true);
    
    // Update state with current values
    setBatchSize(epochCollectionService.getBatchSize());
    setEpochsCompleted(epochCollectionService.getCurrentEpochCount());
    setStatus(epochCollectionService.getStatus());
    setEpochs(epochCollectionService.getEpochs());
    
    // Initial connection status
    setIsConnected(persistentWebSocket.isConnected());
  }, [user]);
  
  // Set up listeners
  useEffect(() => {
    if (!isInitialized) return;
    
    const handleStatusUpdate = (newStatus: EpochCollectionStatus) => {
      setStatus(newStatus);
    };
    
    const handleEpochCompleted = (epoch: EpochData) => {
      setEpochsCompleted(prev => prev + 1);
      setEpochs(prev => [...prev, epoch]);
    };
    
    const handleConnectionChange = () => {
      setIsConnected(persistentWebSocket.isConnected());
    };
    
    // Add event listeners
    epochCollectionService.on('statusUpdate', handleStatusUpdate);
    epochCollectionService.on('epochCompleted', handleEpochCompleted);
    persistentWebSocket.on('statusChange', handleConnectionChange);
    
    // Clean up on unmount
    return () => {
      epochCollectionService.off('statusUpdate', handleStatusUpdate);
      epochCollectionService.off('epochCompleted', handleEpochCompleted);
      persistentWebSocket.off('statusChange', handleConnectionChange);
    };
  }, [isInitialized]);
  
  // Start collection
  const startCollection = useCallback(() => {
    return epochCollectionService.startCollection();
  }, []);
  
  // Stop collection
  const stopCollection = useCallback(() => {
    epochCollectionService.stopCollection();
  }, []);
  
  // Reset collection
  const resetCollection = useCallback(() => {
    epochCollectionService.resetCollection();
  }, []);
  
  // Update batch size
  const updateBatchSize = useCallback((newSize: number) => {
    return epochCollectionService.updateBatchSize(newSize);
  }, []);
  
  return {
    status,
    batchSize,
    isInitialized,
    isActive: status.isActive,
    progress: status.progress,
    epochsCompleted,
    epochs,
    isConnected,
    startCollection,
    stopCollection,
    resetCollection,
    updateBatchSize
  };
}
