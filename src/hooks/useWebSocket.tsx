import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { brokerWebSockets } from '@/types/chartTypes';

interface WebSocketOptions {
  wsUrl: string;
  subscription: object;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface TickData {
  timestamp: string;
  value: number;
  market: string;
}

// Sample subscription formats for different brokers
export const subscriptionFormats = {
  deriv: { ticks: 'R_10' },
  iqOption: { symbol: 'EURUSD' },
  binance: { method: 'SUBSCRIBE', params: ['btcusdt@ticker'] },
  metatrader: { symbol: 'EURUSD' },
  binary: { ticks: 'V_75' }
};

export function useWebSocket({
  wsUrl,
  subscription,
  autoReconnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 10,
  onMessage,
  onError,
  onOpen,
  onClose
}: WebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [ticks, setTicks] = useState<TickData[]>([]);
  const [latestTick, setLatestTick] = useState<TickData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoReconnectRef = useRef(autoReconnect);
  
  useEffect(() => {
    autoReconnectRef.current = autoReconnect;
  }, [autoReconnect]);

  const storeTickInSupabase = useCallback(async (tickData: TickData) => {
    try {
      const { error } = await supabase.from('ticks').insert({
        timestamp: tickData.timestamp,
        value: tickData.value,
        market: tickData.market
      });
      
      if (error) {
        console.error('Error storing tick in Supabase:', error);
      }
    } catch (err) {
      console.error('Failed to store tick:', err);
    }
  }, []);

  const throttle = useCallback(<T extends any[]>(
    callback: (...args: T) => void, 
    limit: number
  ) => {
    let waiting = false;
    return (...args: T) => {
      if (!waiting) {
        callback(...args);
        waiting = true;
        setTimeout(() => {
          waiting = false;
        }, limit);
      }
    };
  }, []);

  const throttledStoreTick = throttle(storeTickInSupabase, 100);

  const connect = useCallback(() => {
    if (!wsUrl) {
      setError(new Error('WebSocket URL is required'));
      return;
    }
    
    try {
      console.log(`Connecting to WebSocket: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        setReconnectCount(0);
        
        if (subscription && Object.keys(subscription).length > 0) {
          ws.send(JSON.stringify(subscription));
        }
        
        if (onOpen) onOpen();
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          let tickData: TickData | null = null;
          
          if (data.tick) {
            tickData = {
              timestamp: new Date(data.tick.epoch * 1000).toISOString(),
              value: data.tick.quote,
              market: data.tick.symbol
            };
          }
          else if (data.s && data.p) {
            tickData = {
              timestamp: new Date().toISOString(),
              value: parseFloat(data.p),
              market: data.s
            };
          }
          else if (data.symbol && data.price) {
            tickData = {
              timestamp: new Date().toISOString(),
              value: data.price,
              market: data.symbol
            };
          }
          else if (data.price !== undefined && data.timestamp !== undefined) {
            tickData = {
              timestamp: new Date(data.timestamp).toISOString(),
              value: data.price,
              market: data.market || 'unknown'
            };
          }
          
          if (tickData) {
            setLatestTick(tickData);
            setTicks(prev => [...prev.slice(-999), tickData!]);
            throttledStoreTick(tickData);
          }
          
          if (onMessage) onMessage(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err, event.data);
          if (onError) onError(err);
        }
      };
      
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError(new Error('WebSocket connection error'));
        if (onError) onError(event);
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        
        if (onClose) onClose();
        
        if (autoReconnectRef.current && reconnectCount < maxReconnectAttempts) {
          console.log(`Attempting to reconnect in ${reconnectInterval}ms (${reconnectCount + 1}/${maxReconnectAttempts})`);
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectCount(prev => prev + 1);
            connect();
          }, reconnectInterval);
        } else if (reconnectCount >= maxReconnectAttempts) {
          setError(new Error(`Failed to reconnect after ${maxReconnectAttempts} attempts`));
          toast.error(`Connection lost. Failed to reconnect after ${maxReconnectAttempts} attempts.`);
        }
      };
      
      socketRef.current = ws;
      
    } catch (err: any) {
      console.error('Error creating WebSocket:', err);
      setError(err);
      if (onError) onError(err);
    }
  }, [wsUrl, subscription, reconnectCount, reconnectInterval, maxReconnectAttempts, onOpen, onMessage, onError, onClose, throttledStoreTick]);
  
  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    socketRef.current = null;
    setIsConnected(false);
  }, []);
  
  const send = useCallback((message: object | string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      socketRef.current.send(messageStr);
      return true;
    } else {
      console.error('WebSocket is not connected');
      return false;
    }
  }, []);

  useEffect(() => {
    if (wsUrl) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [wsUrl, connect, disconnect]);

  return {
    isConnected,
    ticks,
    latestTick,
    error,
    reconnectCount,
    connect,
    disconnect,
    send
  };
}

export { brokerWebSockets };
