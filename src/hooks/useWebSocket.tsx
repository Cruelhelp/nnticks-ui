
// This file is now a compatibility layer for existing components
// It will eventually be phased out in favor of useWebSocketClient

import { useState, useEffect, useRef } from 'react';
import { useWebSocketClient } from './useWebSocketClient';
import { wsManager } from '@/services/WebSocketManager';
import { TickData } from '@/types/chartTypes';

interface WebSocketOptions {
  wsUrl?: string;
  subscription?: object;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

// Common subscription formats for different brokers
export const subscriptionFormats = {
  deriv: { ticks: 'R_10' },
  iqOption: { symbol: 'EURUSD' },
  binance: { method: 'SUBSCRIBE', params: ['btcusdt@ticker'] },
  metatrader: { symbol: 'EURUSD' },
  binary: { ticks: 'V_75' }
};

export function useWebSocket({
  wsUrl = "wss://ws.binaryws.com/websockets/v3?app_id=70997",
  subscription = { ticks: 'R_10' },
  autoReconnect = true,
  onMessage,
  onError,
  onOpen,
  onClose
}: WebSocketOptions = {}) {
  // Use the new hook with legacy API compatibility
  const {
    isConnected,
    connectionStatus,
    ticks,
    latestTick,
    hasRecentData,
    connect,
    send
  } = useWebSocketClient({
    autoConnect: false, // We'll handle connection manually for compatibility
    subscription,
    onMessage,
    onError,
    onStatusChange: (status) => {
      if (status === 'connected' && onOpen) onOpen();
      if (status === 'disconnected' && onClose) onClose();
    }
  });

  // Connect if URL is provided (mimicking legacy behavior)
  useEffect(() => {
    if (wsUrl) {
      // Update WebSocket manager config
      wsManager.updateConfig({ 
        url: wsUrl, 
        subscription
      });
      
      // Connect
      connect();
    }
    
    // This is a no-op function in our persistent model
    return () => {
      // Don't disconnect, as we want to maintain the connection
      console.log('[useWebSocket] Component unmounted, but connection will be maintained');
    };
  }, [wsUrl, connect, subscription]);

  // Maintain legacy API
  const legacyApi = {
    isConnected,
    connectionStatus,
    ticks,
    latestTick,
    hasRecentData,
    error: connectionStatus === 'error' ? new Error('WebSocket connection error') : null,
    reconnectCount: 0, // Not tracked in new implementation
    socketAttempts: 0,  // Not tracked in new implementation
    connect,
    disconnect: () => {
      // This is now a no-op function that doesn't actually disconnect
      console.log('[useWebSocket] Disconnect called, but connection will be maintained');
      return true;
    },
    send
  };

  return legacyApi;
}

export { type TickData, brokerWebSockets } from '@/types/chartTypes';
