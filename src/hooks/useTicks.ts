
import { useState, useEffect, useCallback } from 'react';
import { useWebSocketClient } from '@/hooks/useWebSocketClient';
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
  const { ticks: wsTicks, latestTick, isConnected, connectionStatus } = useWebSocketClient();
  
  const [ticks, setTicks] = useState<TickData[]>([]);
  const [tickCount, setTickCount] = useState(0);
  
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
  
  // Get tick count from Supabase
  const getTickCount = useCallback(async () => {
    if (!user || !storeInSupabase) return;
    
    const count = await tickService.getTickCount(market);
    setTickCount(count);
    
    // If updateEpochs is enabled, add new epochs based on tick count
    if (updateEpochs && count > 0) {
      // Add 1 epoch for every 100 ticks
      const epochsToAdd = Math.floor(count / 100);
      if (epochsToAdd > 0) {
        await trainingService.addEpochs(epochsToAdd);
      }
    }
  }, [user, storeInSupabase, market, updateEpochs]);
  
  useEffect(() => {
    getTickCount();
    
    // Refresh count every minute
    const interval = setInterval(getTickCount, 60000);
    return () => clearInterval(interval);
  }, [getTickCount]);
  
  // Store new ticks in Supabase
  useEffect(() => {
    if (!latestTick || !storeInSupabase || !user) return;
    
    tickService.storeTick(latestTick).then(() => {
      setTickCount(prev => {
        const newCount = prev + 1;
        
        // If updateEpochs is enabled and we've hit a multiple of 100
        if (updateEpochs && newCount % 100 === 0) {
          trainingService.addEpochs(1);
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
    loadHistoricalTicks
  };
}
