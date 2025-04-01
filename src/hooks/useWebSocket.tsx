
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
  maxReconnectAttempts = 5, // Reduced from 10 to prevent excessive reconnection attempts
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
  const connectionStableRef = useRef(true); // Track if connection is stable
  const lastMessageTimeRef = useRef<number>(0); // Track time of last received message
  
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
        // Don't show toast for database errors to avoid overwhelming the user
        console.error('Error storing tick in Supabase:', error);
      }
    } catch (err) {
      console.error('Failed to store tick:', err);
    }
  }, []);

  // Throttle to avoid too many database writes
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

  const throttledStoreTick = throttle(storeTickInSupabase, 500); // Increased throttle time

  const connect = useCallback(() => {
    if (!wsUrl) {
      setError(new Error('WebSocket URL is required'));
      return;
    }
    
    try {
      console.log(`Connecting to WebSocket: ${wsUrl}`);
      
      // Disconnect existing connection if any
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        setReconnectCount(0);
        connectionStableRef.current = true;
        lastMessageTimeRef.current = Date.now();
        
        if (subscription && Object.keys(subscription).length > 0) {
          ws.send(JSON.stringify(subscription));
        }
        
        if (onOpen) onOpen();
      };
      
      ws.onmessage = (event) => {
        try {
          lastMessageTimeRef.current = Date.now();
          const data = JSON.parse(event.data);
          
          // Skip heartbeat messages
          if (data.ping || data.heartbeat) {
            return;
          }
          
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
            setTicks(prev => [...prev.slice(-99), tickData!]); // Keep only last 100 ticks
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
        connectionStableRef.current = false;
        if (onError) onError(event);
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        connectionStableRef.current = false;
        
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
          // Use a unique ID for the toast to prevent duplicates
          toast.error(`Connection lost. Failed to reconnect after ${maxReconnectAttempts} attempts.`, {
            id: 'reconnect-failure'
          });
        }
      };
      
      socketRef.current = ws;
      
      // Set up connection watchdog
      const watchdogInterval = setInterval(() => {
        if (isConnected && lastMessageTimeRef.current > 0) {
          const now = Date.now();
          const timeSinceLastMessage = now - lastMessageTimeRef.current;
          
          // If no messages received for 15 seconds, consider connection stalled
          if (timeSinceLastMessage > 15000 && connectionStableRef.current) {
            console.warn('Connection appears stalled. No messages in 15s.');
            connectionStableRef.current = false;
            
            // Send a ping to check connection
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              try {
                socketRef.current.send(JSON.stringify({ ping: 1 }));
              } catch (err) {
                console.error('Failed to send ping:', err);
                // Force reconnect
                disconnect();
                if (autoReconnectRef.current) {
                  setTimeout(() => connect(), 1000);
                }
              }
            }
          }
        }
      }, 5000);
      
      return () => clearInterval(watchdogInterval);
      
    } catch (err: any) {
      console.error('Error creating WebSocket:', err);
      setError(err);
      if (onError) onError(err);
    }
  }, [wsUrl, subscription, reconnectCount, reconnectInterval, maxReconnectAttempts, onOpen, onMessage, onError, onClose, throttledStoreTick]);
  
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN || 
          socketRef.current.readyState === WebSocket.CONNECTING) {
        socketRef.current.close();
      }
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    socketRef.current = null;
    setIsConnected(false);
    lastMessageTimeRef.current = 0;
    setReconnectCount(0);
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
    } else {
      disconnect();
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
