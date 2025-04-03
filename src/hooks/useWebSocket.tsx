
// This file is now a compatibility layer for existing components
// It will eventually be phased out in favor of useWebSocketClient

import { useWebSocketClient } from './useWebSocketClient';
import { WebSocketService, TickData } from '@/services/WebSocketService';

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
  wsUrl = "wss://ws.binaryws.com/websockets/v3?app_id=1089",
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
    disconnect,
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
      // Force reconnect with the new URL by disconnecting first
      disconnect();
      
      // Use setTimeout to ensure disconnect completes
      setTimeout(() => {
        // Update WebSocket service config
        WebSocketService.updateConfig({ url: wsUrl, subscription });
        connect();
      }, 100);
    }
    
    return () => {
      disconnect();
    };
  }, [wsUrl, disconnect, connect]);

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
    disconnect,
    send
  };

  return legacyApi;
}

export { type TickData, brokerWebSockets } from '@/types/chartTypes';
