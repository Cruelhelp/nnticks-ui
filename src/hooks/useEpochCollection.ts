
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { epochService, EpochProgressStatus } from '@/services/EpochService';
import { toast } from 'sonner';

export function useEpochCollection() {
  const { user } = useAuth();
  const [status, setStatus] = useState<EpochProgressStatus>(epochService.getStatus());
  const [batchSize, setBatchSize] = useState<number>(100);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Set user ID in epoch service
  useEffect(() => {
    if (user) {
      epochService.setUserId(user.id);
    } else {
      epochService.setUserId(null);
    }
  }, [user]);
  
  // Load the batch size from the epoch service
  useEffect(() => {
    const loadBatchSize = async () => {
      const size = await epochService.getTickBatchSize();
      setBatchSize(size);
      setIsInitialized(true);
    };
    
    loadBatchSize();
  }, [user]);
  
  // Subscribe to epoch service updates
  useEffect(() => {
    const subscriberId = 'useEpochCollection-' + Math.random().toString(36).substring(7);
    
    epochService.subscribe(subscriberId, (newStatus) => {
      setStatus(newStatus);
    });
    
    return () => {
      epochService.unsubscribe(subscriberId);
    };
  }, []);
  
  // Start epoch collection
  const startCollection = useCallback(async () => {
    if (!user) {
      toast.error('You must be logged in to start epoch collection');
      return false;
    }
    
    const success = await epochService.start(batchSize);
    return success;
  }, [user, batchSize]);
  
  // Stop epoch collection
  const stopCollection = useCallback(() => {
    epochService.stop();
  }, []);
  
  // Reset epoch collection
  const resetCollection = useCallback(() => {
    epochService.reset();
  }, []);
  
  // Update batch size
  const updateBatchSize = useCallback(async (newBatchSize: number) => {
    if (newBatchSize < 10) {
      toast.error('Batch size must be at least 10');
      return false;
    }
    
    if (newBatchSize > 1000) {
      toast.error('Batch size must be at most 1000');
      return false;
    }
    
    const success = await epochService.updateTickBatchSize(newBatchSize);
    
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
