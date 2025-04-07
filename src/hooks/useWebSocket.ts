
import { useState, useEffect, useCallback } from 'react';
import { webSocketService } from '@/services/core/WebSocketService';
import { TickData } from '@/types/tickTypes';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  symbols?: string[];
  maxTicks?: number;
  subscription?: object;
  onMessage?: (data: any) => void;
  onTick?: (tick: TickData) => void;
  onStatusChange?: (status: string) => void;
  onError?: (error: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  wsUrl?: string;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { 
    autoConnect = true, 
    symbols = ['R_10'],
    maxTicks = 100,
    subscription,
    onMessage,
    onTick,
    onStatusChange,
    onError,
    onOpen,
    onClose,
    wsUrl
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
    // Custom URL is not directly supported by the core WebSocketService
    // We'll ignore the wsUrl parameter and just connect with the default
    const success = webSocketService.connect();
    
    if (success) {
      if (subscription) {
        // Use the available method to set subscription
        webSocketService.subscribeToTicks(symbols);
      } else if (symbols && symbols.length > 0) {
        webSocketService.subscribeToTicks(symbols);
      }
    }
    
    return success;
  }, [symbols, subscription]);

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
    // Use the right syntax for sending messages through the WebSocketService
    // The WebSocketService implementation shows it takes a message parameter of type object or string
    send: (message: object | string) => {
      if (webSocketService.isWebSocketConnected()) {
        if (typeof message === 'object') {
          const socket = webSocketService['socket'] as WebSocket;
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
            return true;
          }
        }
      }
      return false;
    },
    setSubscription: (sub: object) => webSocketService.subscribeToTicks(
      typeof sub === 'object' && 'ticks' in sub 
        ? [sub.ticks as string] 
        : symbols
    ),
    clearBuffer: () => {
      // WebSocketService doesn't have clearBuffer, 
      // but we can handle this operation client-side
      setTicks([]);
    }
  };
}
