import { useState, useEffect, useCallback } from 'react';
import { useWebSocketClient } from '@/hooks/useWebSocketClient';
import { TickData } from '@/types/chartTypes';
import { useAuth } from '@/contexts/AuthContext';
import { tickService } from '@/services/TickService';

export function useTicks(options: {
  maxTicks?: number;
  storeInSupabase?: boolean;
  market?: string;
} = {}) {
  const { maxTicks = 100, storeInSupabase = true, market } = options;
  const { user } = useAuth();
  const { ticks: wsTicks, latestTick, isConnected, connectionStatus } = useWebSocketClient();
  
  const [ticks, setTicks] = useState<TickData[]>([]);
  const [tickCount, setTickCount] = useState(0);
  
  // Set user ID in tick service
  useEffect(() => {
    if (user) {
      tickService.setUserId(user.id);
    } else {
      tickService.setUserId(null);
    }
  }, [user]);
  
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
  }, [user, storeInSupabase, market]);
  
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
      setTickCount(prev => prev + 1);
    });
  }, [latestTick, storeInSupabase, user]);
  
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
