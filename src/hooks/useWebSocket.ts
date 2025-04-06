
import { useState, useEffect, useCallback } from 'react';
import { webSocketService } from '@/services/core/WebSocketService';
import { TickData } from '@/types/tickTypes';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  symbols?: string[];
  maxTicks?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { 
    autoConnect = true, 
    symbols = ['R_10'],
    maxTicks = 100 
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
  }, []);

  const handleNewTick = useCallback((tick: TickData) => {
    setLatestTick(tick);
    setTicks(prev => {
      const newTicks = [...prev, tick];
      if (newTicks.length > maxTicks) {
        return newTicks.slice(-maxTicks);
      }
      return newTicks;
    });
  }, [maxTicks]);

  const connect = useCallback(() => {
    const success = webSocketService.connect();
    if (success) {
      webSocketService.subscribeToTicks(symbols);
    }
    return success;
  }, [symbols]);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  // Set up event listeners
  useEffect(() => {
    webSocketService.on('statusChange', handleStatusChange);
    webSocketService.on('tick', handleNewTick);
    
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
    };
  }, [autoConnect, connect, handleNewTick, handleStatusChange, maxTicks]);

  return {
    isConnected,
    connectionStatus,
    ticks,
    latestTick,
    connect,
    disconnect
  };
}
