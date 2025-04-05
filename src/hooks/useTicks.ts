import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { TickData } from '@/types/chartTypes';
import { useAuth } from '@/contexts/AuthContext';
import { tickService } from '@/services/TickService';
import { trainingService } from '@/services/TrainingService';

export function useTicks(options: {
  maxTicks?: number;
  storeInSupabase?: boolean;
  market?: string;
  updateEpochs?: boolean;
} = {}) {
  const { maxTicks = 100, storeInSupabase = true, market, updateEpochs = false } = options;
  const { user } = useAuth();
  const { ticks: wsTicks, latestTick, isConnected, connectionStatus } = useWebSocket();
  
  const [ticks, setTicks] = useState<TickData[]>([]);
  const [tickCount, setTickCount] = useState(0);
  const [availableEpochs, setAvailableEpochs] = useState(0);
  
  // Set user ID in tick service
  useEffect(() => {
    if (user) {
      tickService.setUserId(user.id);
      if (updateEpochs) {
        trainingService.setUserId(user.id);
      }
    } else {
      tickService.setUserId(null);
      if (updateEpochs) {
        trainingService.setUserId(null);
      }
    }
  }, [user, updateEpochs]);
  
  // Load historical ticks for initial display
  const loadHistoricalTicks = useCallback(async () => {
    if (!user || !storeInSupabase || !market) return;
    
    const historicalTicks = await tickService.getRecentTicks(market, maxTicks);
    if (historicalTicks.length > 0) {
      setTicks(historicalTicks);
    }
  }, [user, storeInSupabase, market, maxTicks]);
  
  useEffect(() => {
    loadHistoricalTicks();
  }, [loadHistoricalTicks]);
  
  // Get tick count and available epochs from Supabase
  const getTickCountAndEpochs = useCallback(async () => {
    if (!user || !storeInSupabase) return;
    
    const count = await tickService.getTickCount(market);
    setTickCount(count);
    
    if (updateEpochs) {
      // Get available epochs from Supabase
      const epochs = await trainingService.getAvailableEpochs();
      setAvailableEpochs(epochs);
      
      // If no explicit epochs added yet, calculate from tick count
      if (epochs === 0 && count > 0) {
        // Add 1 epoch for every 100 ticks
        const epochsToAdd = Math.floor(count / 100);
        if (epochsToAdd > 0) {
          const updatedEpochs = await trainingService.addEpochs(epochsToAdd);
          setAvailableEpochs(updatedEpochs);
        }
      }
    }
  }, [user, storeInSupabase, market, updateEpochs]);
  
  useEffect(() => {
    getTickCountAndEpochs();
    
    // Refresh count every minute
    const interval = setInterval(getTickCountAndEpochs, 60000);
    return () => clearInterval(interval);
  }, [getTickCountAndEpochs]);
  
  // Store new ticks in Supabase
  useEffect(() => {
    if (!latestTick || !storeInSupabase || !user) return;
    
    tickService.storeTick(latestTick).then(() => {
      setTickCount(prev => {
        const newCount = prev + 1;
        
        // If updateEpochs is enabled and we've hit a multiple of 100
        if (updateEpochs && newCount % 100 === 0) {
          trainingService.addEpochs(1).then(updatedEpochs => {
            setAvailableEpochs(updatedEpochs);
          });
        }
        
        return newCount;
      });
    });
  }, [latestTick, storeInSupabase, user, updateEpochs]);
  
  // Update local ticks array with new data
  useEffect(() => {
    if (wsTicks.length > 0) {
      setTicks(prev => {
        // Keep only the most recent maxTicks
        const newTicks = [...prev, ...wsTicks];
        return newTicks.slice(-maxTicks);
      });
    }
  }, [wsTicks, maxTicks]);
  
  // Clear old ticks from Supabase periodically
  useEffect(() => {
    if (!user || !storeInSupabase) return;
    
    // Clear old ticks once per day
    const cleanup = () => {
      tickService.clearOldTicks(7); // Keep 7 days of data
    };
    
    const interval = setInterval(cleanup, 86400000); // 24 hours
    
    return () => clearInterval(interval);
  }, [user, storeInSupabase]);
  
  return {
    ticks,
    latestTick,
    isConnected,
    connectionStatus,
    tickCount,
    availableEpochs,
    loadHistoricalTicks
  };
}
