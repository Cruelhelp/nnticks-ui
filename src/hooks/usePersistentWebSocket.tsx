
import { useState, useEffect, useCallback, useRef } from 'react';
import { persistentWebSocket } from '@/services/PersistentWebSocketService';
import { TickData } from '@/types/chartTypes';

export function usePersistentWebSocket(options: {
  autoSubscribe?: boolean;
  market?: string;
} = {}) {
  const { autoSubscribe = true, market = 'R_10' } = options;
  
  const [ticks, setTicks] = useState<TickData[]>([]);
  const [latestTick, setLatestTick] = useState<TickData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>(persistentWebSocket.getStatus());
  const [isConnected, setIsConnected] = useState<boolean>(persistentWebSocket.isConnected());
  
  // Use refs to track if component is mounted
  const isMountedRef = useRef(true);
  const ticksAccumulatorRef = useRef<TickData[]>([]);

  // Setup WebSocket event listeners
  useEffect(() => {
    const onTick = (tick: TickData) => {
      if (!isMountedRef.current) {
        console.info('[usePersistentWebSocket] Component unmounted, but connection will be maintained');
        return;
      }
      
      // Update latest tick
      setLatestTick(tick);
      
      // Accumulate ticks
      ticksAccumulatorRef.current = [...ticksAccumulatorRef.current, tick];
      if (ticksAccumulatorRef.current.length > 50) {
        ticksAccumulatorRef.current = ticksAccumulatorRef.current.slice(-50);
      }
      
      // Debounce setting ticks to avoid excessive re-renders
      setTicks([...ticksAccumulatorRef.current]);
    };
    
    const onStatusChange = (status: string) => {
      if (!isMountedRef.current) return;
      
      setConnectionStatus(status);
      setIsConnected(persistentWebSocket.isConnected());
    };
    
    // Subscribe to events
    persistentWebSocket.on('tick', onTick);
    persistentWebSocket.on('statusChange', onStatusChange);
    
    // Set initial state
    setIsConnected(persistentWebSocket.isConnected());
    setConnectionStatus(persistentWebSocket.getStatus());
    
    // Set up subscription if provided
    if (autoSubscribe && market) {
      persistentWebSocket.setSubscription({ ticks: market });
    }
    
    // Initialize ticks from buffer if available
    const bufferedTicks = persistentWebSocket.getBufferedTicks();
    if (bufferedTicks.length > 0) {
      ticksAccumulatorRef.current = bufferedTicks.slice(-50);
      setTicks([...ticksAccumulatorRef.current]);
      setLatestTick(bufferedTicks[bufferedTicks.length - 1]);
    }
    
    // Clean up on unmount
    return () => {
      isMountedRef.current = false;
      
      // Remove event listeners
      persistentWebSocket.off('tick', onTick);
      persistentWebSocket.off('statusChange', onStatusChange);
    };
  }, [autoSubscribe, market]);
  
  // Update market subscription if it changes
  useEffect(() => {
    if (autoSubscribe && market && persistentWebSocket.isConnected()) {
      persistentWebSocket.setSubscription({ ticks: market });
    }
  }, [autoSubscribe, market]);
  
  // Function to send messages to the WebSocket
  const send = useCallback((message: object | string) => {
    return persistentWebSocket.send(message);
  }, []);
  
  // Connect manually
  const connect = useCallback(() => {
    return persistentWebSocket.connect();
  }, []);
  
  return {
    ticks,
    latestTick,
    isConnected,
    connectionStatus,
    send,
    connect
  };
}
