
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { epochService } from '@/services/core/EpochService';
import { webSocketService } from '@/services/core/WebSocketService';
import { EpochCollectionStatus, EpochData, EpochServiceState } from '@/types/epochTypes';

export function useEpochCollection() {
  const { user } = useAuth();
  const [state, setState] = useState<EpochServiceState>({
    status: epochService.getStatus(),
    batchSize: epochService.getBatchSize(),
    isInitialized: false,
    isActive: epochService.getStatus().isActive,
    progress: epochService.getStatus().progress,
    epochsCompleted: epochService.getCurrentEpochCount(),
    epochs: epochService.getEpochs(),
    isConnected: webSocketService.isWebSocketConnected()
  });
  
  // Initialize service when user is available
  useEffect(() => {
    epochService.init(user?.id || null);
    
    setState(prev => ({
      ...prev,
      isInitialized: true,
      status: epochService.getStatus(),
      batchSize: epochService.getBatchSize(),
      isActive: epochService.getStatus().isActive,
      progress: epochService.getStatus().progress,
      epochsCompleted: epochService.getCurrentEpochCount(),
      epochs: epochService.getEpochs(),
      isConnected: webSocketService.isWebSocketConnected()
    }));
  }, [user]);
  
  // Set up listeners
  useEffect(() => {
    if (!state.isInitialized) return;
    
    const handleStatusUpdate = (newStatus: EpochCollectionStatus) => {
      setState(prev => ({
        ...prev,
        status: newStatus,
        isActive: newStatus.isActive,
        progress: newStatus.progress
      }));
    };
    
    const handleEpochCompleted = (epoch: EpochData) => {
      setState(prev => ({
        ...prev,
        epochsCompleted: prev.epochsCompleted + 1,
        epochs: [...prev.epochs, epoch]
      }));
    };
    
    const handleConnectionChange = ({ connected }: { connected: boolean }) => {
      setState(prev => ({
        ...prev,
        isConnected: connected
      }));
    };
    
    // Add event listeners
    epochService.on('statusUpdate', handleStatusUpdate);
    epochService.on('epochCompleted', handleEpochCompleted);
    webSocketService.on('statusChange', handleConnectionChange);
    
    // Clean up on unmount
    return () => {
      epochService.off('statusUpdate', handleStatusUpdate);
      epochService.off('epochCompleted', handleEpochCompleted);
      webSocketService.off('statusChange', handleConnectionChange);
    };
  }, [state.isInitialized]);
  
  // Start collection
  const startCollection = useCallback(() => {
    const result = epochService.startCollection();
    if (result) {
      setState(prev => ({
        ...prev,
        isActive: true
      }));
    }
    return result;
  }, []);
  
  // Stop collection
  const stopCollection = useCallback(() => {
    epochService.stopCollection();
    setState(prev => ({
      ...prev,
      isActive: false
    }));
  }, []);
  
  // Reset collection
  const resetCollection = useCallback(() => {
    epochService.resetCollection();
    setState(prev => ({
      ...prev,
      status: {
        ...prev.status,
        currentCount: 0,
        progress: 0
      }
    }));
  }, []);
  
  // Update batch size
  const updateBatchSize = useCallback((newSize: number) => {
    const result = epochService.updateBatchSize(newSize);
    if (result) {
      setState(prev => ({
        ...prev,
        batchSize: newSize,
        status: {
          ...prev.status,
          targetCount: newSize
        }
      }));
    }
    return result;
  }, []);
  
  return {
    ...state,
    startCollection,
    stopCollection,
    resetCollection,
    updateBatchSize
  };
}
