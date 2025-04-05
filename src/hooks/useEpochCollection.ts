
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { epochCollectionService, EpochCollectionStatus } from '@/services/EpochCollectionService';
import { toast } from 'sonner';

export function useEpochCollection() {
  const { user } = useAuth();
  const [status, setStatus] = useState<EpochCollectionStatus>(epochCollectionService.getStatus());
  const [batchSize, setBatchSize] = useState<number>(epochCollectionService.getTickBatchSize());
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Set user ID in epoch service
  useEffect(() => {
    if (user) {
      epochCollectionService.setUserId(user.id);
    } else {
      epochCollectionService.setUserId(null);
    }
  }, [user]);
  
  // Load the batch size from the epoch service
  useEffect(() => {
    setBatchSize(epochCollectionService.getTickBatchSize());
    setIsInitialized(true);
  }, [user]);
  
  // Subscribe to epoch service updates
  useEffect(() => {
    const subscriberId = 'useEpochCollection-' + Math.random().toString(36).substring(7);
    
    epochCollectionService.subscribe(subscriberId, (newStatus) => {
      setStatus(newStatus);
    });
    
    return () => {
      epochCollectionService.unsubscribe(subscriberId);
    };
  }, []);
  
  // Start epoch collection
  const startCollection = useCallback(async () => {
    if (!user) {
      toast.error('You must be logged in to start epoch collection');
      return false;
    }
    
    const success = await epochCollectionService.start(batchSize);
    return success;
  }, [user, batchSize]);
  
  // Stop epoch collection
  const stopCollection = useCallback(() => {
    epochCollectionService.stop();
  }, []);
  
  // Reset epoch collection
  const resetCollection = useCallback(() => {
    epochCollectionService.reset();
  }, []);
  
  // Update batch size
  const updateBatchSize = useCallback(async (newBatchSize: number) => {
    const success = await epochCollectionService.updateTickBatchSize(newBatchSize);
    
    if (success) {
      setBatchSize(newBatchSize);
      toast.success(`Batch size updated to ${newBatchSize}`);
    } else {
      toast.error('Failed to update batch size');
    }
    
    return success;
  }, []);
  
  return {
    status,
    batchSize,
    isInitialized,
    isActive: status.active,
    progress: status.progress,
    epochsCompleted: status.epochsCompleted,
    startCollection,
    stopCollection,
    resetCollection,
    updateBatchSize
  };
}
