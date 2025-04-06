
import { useState, useEffect, useCallback, useRef } from 'react';
import wsManager from '@/services/WebSocketManager';
import { TickData } from '@/types/chartTypes';

export function usePersistentWebSocket(options: {
  autoSubscribe?: boolean;
  market?: string;
} = {}) {
  const { autoSubscribe = true, market = 'R_10' } = options;
  
  const [ticks, setTicks] = useState<TickData[]>([]);
  const [latestTick, setLatestTick] = useState<TickData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>(wsManager.getStatus());
  const [isConnected, setIsConnected] = useState<boolean>(wsManager.isConnected());
  
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
      setTicks(ticksAccumulatorRef.current);
    };
    
    const onStatusChange = (status: string) => {
      if (!isMountedRef.current) return;
      
      setConnectionStatus(status);
      setIsConnected(wsManager.isConnected());
    };
    
    // Subscribe to events
    wsManager.on('tick', onTick);
    wsManager.on('statusChange', onStatusChange);
    
    // Set initial state
    setIsConnected(wsManager.isConnected());
    setConnectionStatus(wsManager.getStatus());
    
    // Set up subscription if provided
    if (autoSubscribe && market) {
      wsManager.setSubscription({ ticks: market });
    }
    
    // Initialize ticks from buffer if available
    const bufferedTicks = wsManager.getBufferedTicks();
    if (bufferedTicks.length > 0) {
      ticksAccumulatorRef.current = bufferedTicks.slice(-50);
      setTicks(ticksAccumulatorRef.current);
      setLatestTick(bufferedTicks[bufferedTicks.length - 1]);
    }
    
    // Clean up on unmount
    return () => {
      isMountedRef.current = false;
      
      // Remove event listeners
      wsManager.off('tick', onTick);
      wsManager.off('statusChange', onStatusChange);
      
      // Note: We don't disconnect the WebSocket, as it's managed globally by WebSocketManager
      // This allows the connection to persist across component unmounts
    };
  }, [autoSubscribe, market]);
  
  // Update market subscription if it changes
  useEffect(() => {
    if (autoSubscribe && market) {
      wsManager.setSubscription({ ticks: market });
    }
  }, [autoSubscribe, market]);
  
  // Function to send messages to the WebSocket
  const send = useCallback((message: object | string) => {
    return wsManager.send(message);
  }, []);
  
  // Connect manually
  const connect = useCallback(() => {
    return wsManager.connect();
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
