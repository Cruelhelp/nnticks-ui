import { toast } from 'sonner';
import { BrowserEventEmitter } from '@/lib/utils';

export interface TickData {
  timestamp: string;
  value: number;
  market: string;
}

/**
 * Persistent WebSocket Service that maintains connection throughout app lifecycle
 */
export class PersistentWebSocketService {
  private socket: WebSocket | null = null;
  private eventEmitter = new BrowserEventEmitter();
  private lastMessageTime = Date.now();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionMonitorInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 15;
  private reconnectDelay = 3000;
  private ticks: TickData[] = [];
  private tickBuffer: TickData[] = [];
  private bufferSize = 1000;
  private autoReconnect = true;
  private status: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';
  
  // Configuration
  private config = {
    url: "wss://ws.binaryws.com/websockets/v3?app_id=70997",
    apiKey: "7KKDlK9AUf3WNM3",
    subscription: { ticks: 'R_10' }
  };

  constructor() {
    // Initialize connection monitor
    this.startConnectionMonitor();
    
    // Connect on initialization
    this.connect();
    
    // Setup page visibility handling
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      window.addEventListener('beforeunload', this.cleanup);
    }
    
    console.log('[PersistentWebSocketService] Initialized');
  }
  
  // Public Methods
  
  /**
   * Connect to WebSocket server
   */
  public connect(): boolean {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('[PersistentWebSocketService] Already connected or connecting');
      return false;
    }
    
    this.cleanup();
    
    try {
      console.log(`[PersistentWebSocketService] Connecting to ${this.config.url}`);
      this.status = 'connecting';
      this.emitEvent('statusChange', this.status);
      
      this.socket = new WebSocket(this.config.url);
      this.socket.onopen = this.handleOpen;
      this.socket.onmessage = this.handleMessage;
      this.socket.onerror = this.handleError;
      this.socket.onclose = this.handleClose;
      
      return true;
    } catch (error) {
      console.error('[PersistentWebSocketService] Connection error:', error);
      this.handleError(error as Event);
      return false;
    }
  }
  
  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.autoReconnect = false;
    this.cleanup();
    
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {
        console.error('[PersistentWebSocketService] Error closing socket:', e);
      }
    }
    
    this.socket = null;
    this.status = 'disconnected';
    this.emitEvent('statusChange', this.status);
    console.log('[PersistentWebSocketService] Disconnected');
  }
  
  /**
   * Send message to WebSocket server
   */
  public send(message: object | string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('[PersistentWebSocketService] Cannot send, socket not open');
      return false;
    }
    
    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(messageStr);
      return true;
    } catch (error) {
      console.error('[PersistentWebSocketService] Error sending message:', error);
      return false;
    }
  }
  
  /**
   * Update WebSocket configuration
   */
  public updateConfig(config: Partial<typeof this.config>): void {
    const wasConnected = this.isConnected();
    this.config = { ...this.config, ...config };
    
    // Reconnect if already connected to apply new config
    if (wasConnected) {
      this.disconnect();
      setTimeout(() => this.connect(), 500);
    }
  }
  
  /**
   * Set subscription for tick data
   */
  public setSubscription(subscription: any): void {
    // Ensure subscription has ticks property
    const ensuredSubscription = this.ensureTicksProperty(subscription);
    this.config.subscription = ensuredSubscription;
    
    // First, forget all previous subscriptions
    if (this.isConnected()) {
      this.send({ forget_all: 'ticks' });
      
      // Then, send new subscription
      setTimeout(() => {
        this.send(this.config.subscription);
      }, 500);
    }
  }
  
  /**
   * Ensure subscription object has ticks property
   */
  private ensureTicksProperty(subscription: any): { ticks: string } & Record<string, any> {
    if (!subscription || Object.keys(subscription).length === 0 || !('ticks' in subscription)) {
      return { ...subscription, ticks: 'R_10' };
    }
    return subscription as { ticks: string } & Record<string, any>;
  }
  
  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  /**
   * Get connection status
   */
  public getStatus(): string {
    return this.status;
  }
  
  /**
   * Get all ticks
   */
  public getTicks(): TickData[] {
    return [...this.ticks];
  }
  
  /**
   * Get latest tick
   */
  public getLatestTick(): TickData | null {
    return this.ticks.length > 0 ? this.ticks[this.ticks.length - 1] : null;
  }
  
  /**
   * Get buffered ticks
   */
  public getBufferedTicks(): TickData[] {
    return [...this.tickBuffer];
  }
  
  /**
   * Clear tick buffer
   */
  public clearBuffer(): void {
    this.tickBuffer = [];
  }
  
  /**
   * Check if we have recent data (last 10 seconds)
   */
  public hasRecentData(): boolean {
    const latestTick = this.getLatestTick();
    if (!latestTick) return false;
    
    const now = Date.now();
    const tickTime = new Date(latestTick.timestamp).getTime();
    return (now - tickTime) < 10000;
  }
  
  /**
   * Subscribe to events
   */
  public on(event: string, callback: Function): void {
    this.eventEmitter.on(event, callback);
  }
  
  /**
   * Unsubscribe from events
   */
  public off(event: string, callback: Function): void {
    this.eventEmitter.off(event, callback);
  }
  
  // Private Methods
  
  /**
   * Start connection monitor
   */
  private startConnectionMonitor = (): void => {
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
    }
    
    this.connectionMonitorInterval = setInterval(() => {
      // Check if connection is lost or stale
      if (!this.isConnected()) {
        console.log('[PersistentWebSocketService] Connection lost, reconnecting...');
        this.connect();
      } else {
        // Check for stale connection (no messages in 30 seconds)
        const now = Date.now();
        if (now - this.lastMessageTime > 30000) {
          console.log('[PersistentWebSocketService] Connection stale, reconnecting...');
          // Send ping to check if connection is still alive
          this.send({ ping: 1 });
          
          // If no response in 5 seconds, reconnect
          setTimeout(() => {
            if (now - this.lastMessageTime > 30000) {
              if (this.socket) {
                this.socket.close();
              }
              this.connect();
            }
          }, 5000);
        }
      }
    }, 15000); // Check every 15 seconds
  };
  
  /**
   * Cleanup function
   */
  private cleanup = (): void => {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
      this.connectionMonitorInterval = null;
    }
  };
  
  /**
   * Schedule reconnect
   */
  private scheduleReconnect = (): void => {
    if (this.reconnectTimer) {
      return;
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[PersistentWebSocketService] Max reconnect attempts reached');
      toast.error('Unable to connect to market data. Please refresh the page.', { 
        duration: 10000,
        id: 'websocket-error'
      });
      return;
    }
    
    this.reconnectAttempts++;
    
    // Exponential backoff with jitter
    const delay = Math.min(
      30000, 
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1) * (0.9 + Math.random() * 0.2)
    );
    
    console.log(`[PersistentWebSocketService] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  };
  
  /**
   * Handle WebSocket open
   */
  private handleOpen = (): void => {
    console.log('[PersistentWebSocketService] Connected successfully');
    this.status = 'connected';
    this.emitEvent('statusChange', this.status);
    this.reconnectAttempts = 0;
    this.lastMessageTime = Date.now();
    
    // Send subscription
    this.send(this.config.subscription);
    
    // Start heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ ping: 1 });
      }
    }, 30000);
  };
  
  /**
   * Handle WebSocket message
   */
  private handleMessage = (event: MessageEvent): void => {
    this.lastMessageTime = Date.now();
    
    try {
      const data = JSON.parse(event.data);
      this.emitEvent('message', data);
      
      // Handle tick data
      let tickData: TickData | null = null;
      
      if (data.tick) {
        tickData = {
          timestamp: new Date(data.tick.epoch * 1000).toISOString(),
          value: Number(data.tick.quote.toFixed(5)),
          market: data.tick.symbol
        };
      }
      else if (data.s && data.p) {
        tickData = {
          timestamp: new Date().toISOString(),
          value: Number(parseFloat(data.p).toFixed(5)),
          market: data.s
        };
      }
      else if (data.symbol && data.price) {
        tickData = {
          timestamp: new Date().toISOString(),
          value: Number(data.price.toFixed(5)),
          market: data.symbol
        };
      }
      
      if (tickData) {
        // Update ticks array (keep last 100)
        this.ticks = [...this.ticks.slice(-99), tickData];
        
        // Update tick buffer (keep last bufferSize)
        this.tickBuffer = [...this.tickBuffer.slice(-this.bufferSize + 1), tickData];
        
        // Emit tick event
        this.emitEvent('tick', tickData);
      }
    } catch (error) {
      console.error('[PersistentWebSocketService] Error parsing message:', error);
    }
  };
  
  /**
   * Handle WebSocket error
   */
  private handleError = (event: Event): void => {
    console.error('[PersistentWebSocketService] WebSocket error:', event);
    this.status = 'error';
    this.emitEvent('statusChange', this.status);
    this.emitEvent('error', event);
    
    if (this.autoReconnect) {
      this.scheduleReconnect();
    }
  };
  
  /**
   * Handle WebSocket close
   */
  private handleClose = (event: CloseEvent): void => {
    console.log('[PersistentWebSocketService] WebSocket closed:', event.code, event.reason);
    this.status = 'disconnected';
    this.emitEvent('statusChange', this.status);
    this.emitEvent('close', event);
    
    if (this.autoReconnect) {
      this.scheduleReconnect();
    }
  };
  
  /**
   * Handle visibility change (tab switching)
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      console.log('[PersistentWebSocketService] Page visible, checking connection');
      if (!this.isConnected()) {
        this.connect();
      }
    } else {
      console.log('[PersistentWebSocketService] Page hidden, connection will be maintained');
    }
  };
  
  /**
   * Handle browser going online
   */
  private handleOnline = (): void => {
    console.log('[PersistentWebSocketService] Network online, reconnecting');
    this.connect();
  };
  
  /**
   * Handle browser going offline
   */
  private handleOffline = (): void => {
    console.log('[PersistentWebSocketService] Network offline');
  };
  
  /**
   * Emit event to subscribers
   */
  private emitEvent(event: string, data: any): void {
    this.eventEmitter.emit(event, data);
  }
}

// Export singleton instance
export const persistentWebSocket = new PersistentWebSocketService();
export default persistentWebSocket;
