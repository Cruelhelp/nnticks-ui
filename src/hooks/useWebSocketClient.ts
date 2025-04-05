import { useState, useEffect, useRef, useMemo } from 'react';
import { wsManager } from '@/services/WebSocketManager';
import { TickData } from '@/types/chartTypes';

interface WebSocketHookOptions {
  autoConnect?: boolean;
  subscription?: object;
  onMessage?: (data: any) => void;
  onTick?: (tick: TickData) => void;
  onStatusChange?: (status: string) => void;
  onError?: (error: any) => void;
}

export function useWebSocketClient(options: WebSocketHookOptions = {}) {
  const {
    autoConnect = true,
    subscription,
    onMessage,
    onTick,
    onStatusChange,
    onError,
  } = options;
  
  const [isConnected, setIsConnected] = useState(wsManager.isConnected());
  const [ticks, setTicks] = useState<TickData[]>(wsManager.getTicks());
  const [latestTick, setLatestTick] = useState<TickData | null>(wsManager.getLatestTick());
  const [connectionStatus, setConnectionStatus] = useState(wsManager.getStatus());
  const [hasRecentData, setHasRecentData] = useState(wsManager.hasRecentData());
  
  const callbacksRef = useRef({
    onMessage,
    onTick,
    onStatusChange,
    onError,
  });
  
  // Update callbacks ref when props change
  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onTick,
      onStatusChange,
      onError,
    };
  }, [onMessage, onTick, onStatusChange, onError]);
  
  // Setup event listeners
  useEffect(() => {
    const handleMessage = (data: any) => {
      callbacksRef.current.onMessage?.(data);
    };
    
    const handleTick = (tick: TickData) => {
      setTicks(wsManager.getTicks());
      setLatestTick(tick);
      setHasRecentData(wsManager.hasRecentData());
      callbacksRef.current.onTick?.(tick);
    };
    
    const handleStatusChange = (status: string) => {
      setConnectionStatus(status);
      setIsConnected(wsManager.isConnected());
      callbacksRef.current.onStatusChange?.(status);
    };
    
    const handleError = (error: any) => {
      callbacksRef.current.onError?.(error);
    };
    
    // Add event listeners
    wsManager.on('message', handleMessage);
    wsManager.on('tick', handleTick);
    wsManager.on('statusChange', handleStatusChange);
    wsManager.on('error', handleError);
    
    // Handle initial subscription if provided
    if (subscription && Object.keys(subscription).length > 0) {
      wsManager.setSubscription(subscription);
    }
    
    // Connect if requested and not already connected
    if (autoConnect && !wsManager.isConnected()) {
      wsManager.connect();
    }
    
    // Check for recent data periodically
    const intervalId = setInterval(() => {
      setHasRecentData(wsManager.hasRecentData());
    }, 1000);
    
    // Clean up event listeners on unmount
    return () => {
      wsManager.off('message', handleMessage);
      wsManager.off('tick', handleTick);
      wsManager.off('statusChange', handleStatusChange);
      wsManager.off('error', handleError);
      clearInterval(intervalId);
    };
  }, [autoConnect, subscription]);
  
  // Memoized API
  const api = useMemo(() => ({
    connect: () => wsManager.connect(),
    disconnect: () => {
      console.log('[useWebSocketClient] Disconnect called, but connection will be maintained');
      return true;
    },
    send: (message: object | string) => wsManager.send(message),
    setSubscription: (sub: object) => wsManager.setSubscription(sub),
  }), []);
  
  return {
    isConnected,
    connectionStatus,
    ticks,
    latestTick,
    hasRecentData,
    ...api
  };
}
