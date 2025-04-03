
import { useState, useEffect, useRef, useMemo } from 'react';
import { webSocketService, TickData } from '@/services/WebSocketService';

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
  
  const [isConnected, setIsConnected] = useState(webSocketService.isConnected());
  const [ticks, setTicks] = useState<TickData[]>(webSocketService.getTicks());
  const [latestTick, setLatestTick] = useState<TickData | null>(webSocketService.getLatestTick());
  const [connectionStatus, setConnectionStatus] = useState(webSocketService.getStatus());
  const [hasRecentData, setHasRecentData] = useState(webSocketService.hasRecentData());
  
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
      setTicks(webSocketService.getTicks());
      setLatestTick(tick);
      setHasRecentData(webSocketService.hasRecentData());
      callbacksRef.current.onTick?.(tick);
    };
    
    const handleStatusChange = (status: string) => {
      setConnectionStatus(status);
      setIsConnected(webSocketService.isConnected());
      callbacksRef.current.onStatusChange?.(status);
    };
    
    const handleError = (error: any) => {
      callbacksRef.current.onError?.(error);
    };
    
    // Add event listeners
    webSocketService.on('message', handleMessage);
    webSocketService.on('tick', handleTick);
    webSocketService.on('statusChange', handleStatusChange);
    webSocketService.on('error', handleError);
    
    // Handle initial subscription if provided
    if (subscription && Object.keys(subscription).length > 0) {
      webSocketService.setSubscription(subscription);
    }
    
    // Connect if requested and not already connected
    if (autoConnect && !webSocketService.isConnected()) {
      webSocketService.connect();
    }
    
    // Check for recent data periodically
    const intervalId = setInterval(() => {
      setHasRecentData(webSocketService.hasRecentData());
    }, 1000);
    
    // Clean up event listeners on unmount
    return () => {
      webSocketService.off('message', handleMessage);
      webSocketService.off('tick', handleTick);
      webSocketService.off('statusChange', handleStatusChange);
      webSocketService.off('error', handleError);
      clearInterval(intervalId);
    };
  }, [autoConnect, subscription]);
  
  // Memoized API
  const api = useMemo(() => ({
    connect: () => webSocketService.connect(),
    disconnect: () => webSocketService.disconnect(),
    send: (message: object | string) => webSocketService.send(message),
    setSubscription: (sub: object) => webSocketService.setSubscription(sub),
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
