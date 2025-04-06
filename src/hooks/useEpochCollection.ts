
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
  const [latestEpoch, setLatestEpoch] = useState<EpochData | null>(null);
  const [isConnected, setIsConnected] = useState(persistentWebSocket.isConnected());
  
  // Initialize service when user is available
  useEffect(() => {
    console.log('Initializing epoch collection service with user:', user?.id);
    epochCollectionService.init(user?.id || null);
    setIsInitialized(true);
    
    // Update state with current values
    setBatchSize(epochCollectionService.getBatchSize());
    setEpochsCompleted(epochCollectionService.getCurrentEpochCount());
    setStatus(epochCollectionService.getStatus());
    
    // Initial connection status
    setIsConnected(persistentWebSocket.isConnected());
  }, [user]);
  
  // Set up listeners
  useEffect(() => {
    if (!isInitialized) return;
    
    console.log('Setting up epoch collection event listeners');
    
    const handleStatusUpdate = (newStatus: EpochCollectionStatus) => {
      setStatus(newStatus);
    };
    
    const handleEpochCompleted = (epoch: EpochData) => {
      console.log('Epoch completed:', epoch);
      setEpochsCompleted(prev => prev + 1);
      setLatestEpoch(epoch);
    };
    
    const handleConnectionChange = (connected: boolean) => {
      console.log('WebSocket connection changed:', connected);
      setIsConnected(connected);
    };
    
    // Add event listeners
    epochCollectionService.on('statusUpdate', handleStatusUpdate);
    epochCollectionService.on('epochCompleted', handleEpochCompleted);
    persistentWebSocket.on('connectionChange', handleConnectionChange);
    
    // Clean up on unmount
    return () => {
      console.log('Removing epoch collection event listeners');
      epochCollectionService.off('statusUpdate', handleStatusUpdate);
      epochCollectionService.off('epochCompleted', handleEpochCompleted);
      persistentWebSocket.off('connectionChange', handleConnectionChange);
    };
  }, [isInitialized]);
  
  // Start collection
  const startCollection = useCallback(() => {
    console.log('Starting epoch collection');
    return epochCollectionService.startCollection();
  }, []);
  
  // Stop collection
  const stopCollection = useCallback(() => {
    console.log('Stopping epoch collection');
    epochCollectionService.stopCollection();
  }, []);
  
  // Reset collection
  const resetCollection = useCallback(() => {
    console.log('Resetting epoch collection');
    epochCollectionService.resetCollection();
  }, []);
  
  // Update batch size
  const updateBatchSize = useCallback((newSize: number) => {
    console.log('Updating batch size:', newSize);
    return epochCollectionService.updateBatchSize(newSize);
  }, []);
  
  return {
    status,
    batchSize,
    isInitialized,
    isActive: status.isActive,
    progress: status.progress,
    epochsCompleted,
    latestEpoch,
    isConnected,
    startCollection,
    stopCollection,
    resetCollection,
    updateBatchSize
  };
}
