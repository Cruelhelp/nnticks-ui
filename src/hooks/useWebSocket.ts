
import { useState, useEffect, useCallback } from 'react';
import { webSocketService } from '@/services/core/WebSocketService';
import { TickData } from '@/types/tickTypes';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  symbols?: string[];
  maxTicks?: number;
  wsUrl?: string;
  subscription?: object;
  onMessage?: (data: any) => void;
  onTick?: (tick: TickData) => void;
  onStatusChange?: (status: string) => void;
  onError?: (error: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { 
    autoConnect = true, 
    symbols = ['R_10'],
    maxTicks = 100,
    wsUrl,
    subscription,
    onMessage,
    onTick,
    onStatusChange,
    onError,
    onOpen,
    onClose
  } = options;
  
  const [isConnected, setIsConnected] = useState<boolean>(webSocketService.isWebSocketConnected());
  const [ticks, setTicks] = useState<TickData[]>(webSocketService.getTicks().slice(-maxTicks));
  const [latestTick, setLatestTick] = useState<TickData | null>(webSocketService.getLatestTick());
  const [connectionStatus, setConnectionStatus] = useState<string>(
    webSocketService.isWebSocketConnected() ? 'connected' : 'disconnected'
  );

  const handleStatusChange = useCallback(({ connected }: { connected: boolean }) => {
    setIsConnected(connected);
    setConnectionStatus(connected ? 'connected' : 'disconnected');
    onStatusChange?.(connected ? 'connected' : 'disconnected');
  }, [onStatusChange]);

  const handleNewTick = useCallback((tick: TickData) => {
    setLatestTick(tick);
    setTicks(prev => {
      const newTicks = [...prev, tick];
      if (newTicks.length > maxTicks) {
        return newTicks.slice(-maxTicks);
      }
      return newTicks;
    });
    onTick?.(tick);
  }, [maxTicks, onTick]);

  const handleMessage = useCallback((data: any) => {
    onMessage?.(data);
  }, [onMessage]);

  const handleError = useCallback((error: any) => {
    onError?.(error);
  }, [onError]);

  const handleOpen = useCallback(() => {
    onOpen?.();
  }, [onOpen]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const connect = useCallback(() => {
    if (wsUrl) {
      webSocketService.setUrl(wsUrl);
    }
    
    const success = webSocketService.connect();
    
    if (success) {
      if (subscription) {
        webSocketService.setSubscription(subscription);
      } else if (symbols && symbols.length > 0) {
        webSocketService.subscribeToTicks(symbols);
      }
    }
    
    return success;
  }, [symbols, wsUrl, subscription]);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  // Set up event listeners
  useEffect(() => {
    webSocketService.on('statusChange', handleStatusChange);
    webSocketService.on('tick', handleNewTick);
    webSocketService.on('message', handleMessage);
    webSocketService.on('error', handleError);
    webSocketService.on('open', handleOpen);
    webSocketService.on('close', handleClose);
    
    // Connect on mount if autoConnect is true
    if (autoConnect && !webSocketService.isWebSocketConnected()) {
      connect();
    }
    
    // Initial states
    setIsConnected(webSocketService.isWebSocketConnected());
    setTicks(webSocketService.getTicks().slice(-maxTicks));
    setLatestTick(webSocketService.getLatestTick());
    
    // Clean up on unmount
    return () => {
      webSocketService.off('statusChange', handleStatusChange);
      webSocketService.off('tick', handleNewTick);
      webSocketService.off('message', handleMessage);
      webSocketService.off('error', handleError);
      webSocketService.off('open', handleOpen);
      webSocketService.off('close', handleClose);
    };
  }, [
    autoConnect, 
    connect, 
    handleNewTick, 
    handleStatusChange, 
    handleMessage,
    handleError,
    handleOpen,
    handleClose,
    maxTicks
  ]);

  return {
    isConnected,
    connectionStatus,
    ticks,
    latestTick,
    connect,
    disconnect,
    send: (message: object | string) => webSocketService.send(message),
    setSubscription: (sub: object) => webSocketService.setSubscription(sub),
    clearBuffer: () => webSocketService.clearBuffer()
  };
}
