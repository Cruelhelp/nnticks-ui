import { useState, useEffect, useRef, useMemo } from 'react';
import { persistentWebSocket } from '@/services/PersistentWebSocketService';
import { TickData } from '@/types/chartTypes';

interface WebSocketHookOptions {
  autoConnect?: boolean;
  subscription?: object;
  wsUrl?: string;
  onMessage?: (data: unknown) => void;
  onTick?: (tick: TickData) => void;
  onStatusChange?: (status: string) => void;
  onError?: (error: unknown) => void;
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
  
  const callbacksRef = useRef({
    onMessage,
    onTick,
    onStatusChange,
    onError,
    onOpen,
    onClose,
  });
  
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
  
  useEffect(() => {

    const handleMessage = (data: unknown) => {
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
    

    const handleError = (error: unknown) => {
      callbacksRef.current.onError?.(error);
    };
    
    const handleOpen = () => {
      callbacksRef.current.onOpen?.();
    };
    
    const handleClose = () => {
      callbacksRef.current.onClose?.();
    };
    
    persistentWebSocket.on('message', handleMessage);
    persistentWebSocket.on('tick', handleTick);
    persistentWebSocket.on('statusChange', handleStatusChange);
    persistentWebSocket.on('error', handleError);
    persistentWebSocket.on('open', handleOpen);
    persistentWebSocket.on('close', handleClose);
    
    if (wsUrl) {
      persistentWebSocket.setUrl(wsUrl);
    }
    
    if (subscription && Object.keys(subscription).length > 0) {
      persistentWebSocket.setSubscription(subscription);
    }
    
    if (autoConnect && !persistentWebSocket.isConnected()) {
      persistentWebSocket.connect();
    }
    
    const intervalId = setInterval(() => {
      setHasRecentData(persistentWebSocket.hasRecentData());
    }, 2000);
    
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

  const api = useMemo(() => ({
    connect: () => persistentWebSocket.connect(),
    disconnect: () => {
      console.log('[usePersistentWebSocket] Disconnect called, but connection will be maintained');
      return true;
    },
    send: (message: object | string) => persistentWebSocket.send(message),
    setSubscription: (sub: object) => persistentWebSocket.setSubscription(sub),
    clearBuffer: () => persistentWebSocket.clearBuffer(),
    getBufferedTicks: () => persistentWebSocket.getBufferedTicks(),
    on: (event: string, callback: (...args: unknown[]) => void) => persistentWebSocket.on(event, callback),
    off: (event: string, callback: (...args: unknown[]) => void) => persistentWebSocket.off(event, callback)
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
