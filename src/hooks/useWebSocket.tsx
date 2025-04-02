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
  maxReconnectAttempts = 5,
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
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [hasRecentData, setHasRecentData] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoReconnectRef = useRef(autoReconnect);
  const connectionStableRef = useRef(true);
  const lastMessageTimeRef = useRef<number>(0);
  const maxAttemptsRef = useRef(maxReconnectAttempts);
  const failSafeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketAttempts = useRef(0);
  const connectingRef = useRef(false);
  
  useEffect(() => {
    autoReconnectRef.current = autoReconnect;
    maxAttemptsRef.current = maxReconnectAttempts;
  }, [autoReconnect, maxReconnectAttempts]);

  useEffect(() => {
    const checkDataInterval = setInterval(() => {
      if (ticks.length > 0) {
        const latestTickTime = new Date(ticks[ticks.length - 1].timestamp).getTime();
        const now = Date.now();
        setHasRecentData(now - latestTickTime < 10000);
      } else {
        setHasRecentData(false);
      }
    }, 1000);
    
    return () => clearInterval(checkDataInterval);
  }, [ticks]);

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

  const throttledStoreTick = throttle(storeTickInSupabase, 500);

  const connect = useCallback(() => {
    if (!wsUrl || connectingRef.current) {
      return;
    }
    
    connectingRef.current = true;
    
    setConnectionStatus('connecting');
    socketAttempts.current += 1;
    
    if (socketAttempts.current > maxAttemptsRef.current) {
      console.error(`Maximum connection attempts reached (${maxAttemptsRef.current}). Connection stopped.`);
      toast.error(`Connection attempts limit reached (${maxAttemptsRef.current}). Please try again manually.`, {
        id: 'max-connection-attempts'
      });
      setConnectionStatus('error');
      setError(new Error(`Maximum connection attempts reached (${maxAttemptsRef.current}). Please try again manually.`));
      connectingRef.current = false;
      return;
    }
    
    if (failSafeTimeoutRef.current) {
      clearTimeout(failSafeTimeoutRef.current);
    }
    
    failSafeTimeoutRef.current = setTimeout(() => {
      socketAttempts.current = 0;
    }, 30000);
    
    try {
      console.log(`Connecting to WebSocket: ${wsUrl} (Attempt ${socketAttempts.current}/${maxAttemptsRef.current})`);
      
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        setReconnectCount(0);
        connectionStableRef.current = true;
        lastMessageTimeRef.current = Date.now();
        connectingRef.current = false;
        
        if (subscription && Object.keys(subscription).length > 0) {
          ws.send(JSON.stringify(subscription));
        }
        
        if (onOpen) onOpen();
        
        socketAttempts.current = 0;
        
        if (socketAttempts.current === 1) {
          toast.success('Connection established', { id: 'connection-established' });
        }
      };
      
      ws.onmessage = (event) => {
        try {
          lastMessageTimeRef.current = Date.now();
          const data = JSON.parse(event.data);
          
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
            tickData.value = parseFloat(tickData.value.toFixed(5));
            
            setLatestTick(tickData);
            setTicks(prev => [...prev.slice(-99), tickData!]);
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
        setConnectionStatus('error');
        connectionStableRef.current = false;
        connectingRef.current = false;
        if (onError) onError(event);
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        connectionStableRef.current = false;
        connectingRef.current = false;
        
        if (onClose) onClose();
        
        if (autoReconnectRef.current && reconnectCount < maxAttemptsRef.current) {
          console.log(`Attempting to reconnect in ${reconnectInterval}ms (${reconnectCount + 1}/${maxAttemptsRef.current})`);
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectCount(prev => prev + 1);
            connect();
          }, reconnectInterval);
        } else if (reconnectCount >= maxAttemptsRef.current) {
          setError(new Error(`Failed to reconnect after ${maxAttemptsRef.current} attempts`));
          setConnectionStatus('error');
          toast.error(`Connection lost. Failed to reconnect after ${maxAttemptsRef.current} attempts.`, {
            id: 'reconnect-failure'
          });
        }
      };
      
      socketRef.current = ws;
      
      const watchdogInterval = setInterval(() => {
        if (isConnected && lastMessageTimeRef.current > 0) {
          const now = Date.now();
          const timeSinceLastMessage = now - lastMessageTimeRef.current;
          
          if (timeSinceLastMessage > 15000 && connectionStableRef.current) {
            console.warn('Connection appears stalled. No messages in 15s.');
            connectionStableRef.current = false;
            
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              try {
                socketRef.current.send(JSON.stringify({ ping: 1 }));
              } catch (err) {
                console.error('Failed to send ping:', err);
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
      setConnectionStatus('error');
      connectingRef.current = false;
      if (onError) onError(err);
    }
  }, [wsUrl, subscription, reconnectCount, reconnectInterval, onOpen, onMessage, onError, onClose, throttledStoreTick]);
  
  const disconnect = useCallback(() => {
    const saveToast = toast.loading('Disconnecting...');
    
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
    
    if (failSafeTimeoutRef.current) {
      clearTimeout(failSafeTimeoutRef.current);
      failSafeTimeoutRef.current = null;
    }
    
    socketRef.current = null;
    setIsConnected(false);
    setConnectionStatus('disconnected');
    lastMessageTimeRef.current = 0;
    setReconnectCount(0);
    socketAttempts.current = 0;
    connectingRef.current = false;
    
    toast.dismiss(saveToast);
    toast.success('Disconnected successfully');
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
    connectionStatus,
    ticks,
    latestTick,
    error,
    reconnectCount,
    socketAttempts: socketAttempts.current,
    hasRecentData,
    connect,
    disconnect,
    send
  };
}

export { brokerWebSockets };
