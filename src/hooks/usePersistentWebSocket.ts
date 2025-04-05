
import { useState, useEffect, useRef, useMemo } from 'react';
import { persistentWebSocket, TickData } from '@/services/PersistentWebSocketService';

interface WebSocketHookOptions {
  autoConnect?: boolean;
  subscription?: object;
  wsUrl?: string; // Added wsUrl property
  onMessage?: (data: any) => void;
  onTick?: (tick: TickData) => void;
  onStatusChange?: (status: string) => void;
  onError?: (error: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export function usePersistentWebSocket(options: WebSocketHookOptions = {}) {
  const {
    autoConnect = true,
    subscription,
    wsUrl,
    onMessage,
    onTick,
    onStatusChange,
    onError,
    onOpen,
    onClose,
  } = options;
  
  const [isConnected, setIsConnected] = useState(persistentWebSocket.isConnected());
  const [ticks, setTicks] = useState<TickData[]>(persistentWebSocket.getTicks());
  const [latestTick, setLatestTick] = useState<TickData | null>(persistentWebSocket.getLatestTick());
  const [connectionStatus, setConnectionStatus] = useState(persistentWebSocket.getStatus());
  const [hasRecentData, setHasRecentData] = useState(persistentWebSocket.hasRecentData());
  
  // Maintain callbacks in a ref to avoid unnecessary re-renders
  const callbacksRef = useRef({
    onMessage,
    onTick,
    onStatusChange,
    onError,
    onOpen,
    onClose,
  });
  
  // Update callbacks ref when props change
  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onTick,
      onStatusChange,
      onError,
      onOpen,
      onClose,
    };
  }, [onMessage, onTick, onStatusChange, onError, onOpen, onClose]);
  
  // Set up event listeners
  useEffect(() => {
    const handleMessage = (data: any) => {
      callbacksRef.current.onMessage?.(data);
    };
    
    const handleTick = (tick: TickData) => {
      setTicks(persistentWebSocket.getTicks());
      setLatestTick(tick);
      setHasRecentData(persistentWebSocket.hasRecentData());
      callbacksRef.current.onTick?.(tick);
    };
    
    const handleStatusChange = (status: string) => {
      setConnectionStatus(status);
      setIsConnected(persistentWebSocket.isConnected());
      callbacksRef.current.onStatusChange?.(status);
    };
    
    const handleError = (error: any) => {
      callbacksRef.current.onError?.(error);
    };
    
    const handleOpen = () => {
      callbacksRef.current.onOpen?.();
    };
    
    const handleClose = () => {
      callbacksRef.current.onClose?.();
    };
    
    // Add event listeners
    persistentWebSocket.on('message', handleMessage);
    persistentWebSocket.on('tick', handleTick);
    persistentWebSocket.on('statusChange', handleStatusChange);
    persistentWebSocket.on('error', handleError);
    persistentWebSocket.on('open', handleOpen);
    persistentWebSocket.on('close', handleClose);
    
    // Set custom WebSocket URL if provided
    if (wsUrl) {
      persistentWebSocket.setUrl(wsUrl);
    }
    
    // Handle initial subscription if provided
    if (subscription && Object.keys(subscription).length > 0) {
      persistentWebSocket.setSubscription(subscription);
    }
    
    // Connect if requested and not already connected
    if (autoConnect && !persistentWebSocket.isConnected()) {
      persistentWebSocket.connect();
    }
    
    // Check for recent data periodically
    const intervalId = setInterval(() => {
      setHasRecentData(persistentWebSocket.hasRecentData());
    }, 2000);
    
    // Clean up event listeners on unmount
    return () => {
      console.log('[usePersistentWebSocket] Component unmounted, but connection will be maintained');
      persistentWebSocket.off('message', handleMessage);
      persistentWebSocket.off('tick', handleTick);
      persistentWebSocket.off('statusChange', handleStatusChange);
      persistentWebSocket.off('error', handleError);
      persistentWebSocket.off('open', handleOpen);
      persistentWebSocket.off('close', handleClose);
      clearInterval(intervalId);
    };
  }, [autoConnect, subscription, wsUrl]);
  
  // Memoized API
  const api = useMemo(() => ({
    connect: () => persistentWebSocket.connect(),
    disconnect: () => {
      console.log('[usePersistentWebSocket] Disconnect called, but connection will be maintained');
      return true;
    },
    send: (message: object | string) => persistentWebSocket.send(message),
    setSubscription: (sub: object) => persistentWebSocket.setSubscription(sub),
    clearBuffer: () => persistentWebSocket.clearBuffer(),
    getBufferedTicks: () => persistentWebSocket.getBufferedTicks()
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
