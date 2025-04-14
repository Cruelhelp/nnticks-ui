import { toast } from 'sonner';
import { BrowserEventEmitter } from '@/lib/utils';

export interface TickData {
  timestamp: string;
  value: number;
  market: string;
}

export interface WSConfig {
  url: string;
  apiKey: string;
  subscription: object;
}

// Default connection settings
const DEFAULT_CONFIG: WSConfig = {
  url: "wss://ws.binaryws.com/websockets/v3?app_id=70997",
  apiKey: "7KKDlK9AUf3WNM3",
  subscription: { ticks: 'R_10' }
};

export class WebSocketService {
  private _config: WSConfig;
  private socket: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private eventEmitter: BrowserEventEmitter = new BrowserEventEmitter();
  private autoReconnect: boolean = true;
  private maxReconnectAttempts: number = 10; // Increased from 5
  private reconnectAttempts: number = 0;
  private lastMessageTime: number = 0;
  private ticks: TickData[] = [];
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private pingTimeout: NodeJS.Timeout | null = null;
  
  constructor(config: Partial<WSConfig> = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config };
  }

  // Add getter for config
  public get config(): WSConfig {
    return { ...this._config };
  }

  public updateConfig(config: Partial<WSConfig>): void {
    const wasConnected = this.isConnected();
    this._config = { ...this._config, ...config };
    
    // Reconnect if already connected to apply new config
    if (wasConnected) {
      this.disconnect();
      setTimeout(() => this.connect(), 100);
    }
  }

  public connect(): boolean {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return false; // Already connected or connecting
    }
    
    // Clean up any previous connection
    this.cleanup();
    
    this.connectionStatus = 'connecting';
    this.emitEvent('statusChange', this.connectionStatus);
    
    try {
      console.log(`[WebSocketService] Connecting to WebSocket: ${this._config.url}`);
      this.socket = new WebSocket(this._config.url);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      
      // Set up connection timeout
      this.setConnectionTimeout();
      
      return true;
    } catch (err) {
      console.error('[WebSocketService] Error creating WebSocket:', err);
      this.handleError(err as Event);
      return false;
    }
  }

  public disconnect(): void {
    this.autoReconnect = false; // Prevent auto reconnect on manual disconnect
    this.cleanup();
    
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      try {
        this.socket.close();
      } catch (e) {
        console.error('[WebSocketService] Error closing socket:', e);
      }
    }
    
    this.socket = null;
    this.connectionStatus = 'disconnected';
    this.emitEvent('statusChange', this.connectionStatus);
  }

  private cleanup(): void {
    // Clear all timers
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }
  
  private setConnectionTimeout(): void {
    // Connection timeout to detect hanging connections
    const connectionTimeout = setTimeout(() => {
      if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
        console.log('[WebSocketService] Connection timeout, closing socket');
        this.socket.close();
        this.handleClose({ code: 4000, reason: 'Connection timeout', wasClean: false } as CloseEvent);
      }
    }, 10000); // 10 second timeout
    
    // Clear timeout when connected
    this.once('statusChange', (status: string) => {
      if (status === 'connected') {
        clearTimeout(connectionTimeout);
      }
    });
  }
  
  private startHeartbeat(): void {
    // Clear any existing heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Send ping every 30 seconds to keep connection alive
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ ping: 1 });
        
        // Set a timeout to check if we got a pong
        if (this.pingTimeout) {
          clearTimeout(this.pingTimeout);
        }
        
        this.pingTimeout = setTimeout(() => {
          console.log('[WebSocketService] Ping timeout, reconnecting');
          this.disconnect();
          this.autoReconnect = true;
          this.connect();
        }, 5000); // Wait 5 seconds for pong
      }
    }, 30000);
  }

  public send(message: object | string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('[WebSocketService] Cannot send, socket not open');
      return false;
    }
    
    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(messageStr);
      return true;
    } catch (err) {
      console.error('[WebSocketService] Error sending message:', err);
      return false;
    }
  }

  public setSubscription(subscription: object): void {
    // Ensure the subscription has at least a 'ticks' property if empty
    if (Object.keys(subscription).length === 0) {
      this._config.subscription = { ticks: 'R_10' };
    } else {
      this._config.subscription = subscription;
    }
    
    if (this.isConnected()) {
      this.send(this._config.subscription);
    }
  }

  public on(event: string, callback: Function): void {
    this.eventEmitter.on(event, callback);
  }

  public off(event: string, callback: Function): void {
    this.eventEmitter.off(event, callback);
  }
  
  public once(event: string, callback: Function): void {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper);
      callback(...args);
    };
    
    this.on(event, onceWrapper);
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public getStatus(): string {
    return this.connectionStatus;
  }

  public getTicks(): TickData[] {
    return [...this.ticks];
  }

  public getLatestTick(): TickData | null {
    return this.ticks.length > 0 ? this.ticks[this.ticks.length - 1] : null;
  }

  public hasRecentData(): boolean {
    const latestTick = this.getLatestTick();
    if (!latestTick) return false;
    
    const now = Date.now();
    const tickTime = new Date(latestTick.timestamp).getTime();
    return (now - tickTime) < 10000; // Consider data recent if less than 10 seconds old
  }
  
  private handleOpen(event: Event): void {
    console.log('[WebSocketService] WebSocket connected');
    this.connectionStatus = 'connected';
    this.emitEvent('statusChange', this.connectionStatus);
    this.emitEvent('open', event);
    this.reconnectAttempts = 0;
    this.lastMessageTime = Date.now();
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Send subscription
    if (this._config.subscription && Object.keys(this._config.subscription).length > 0) {
      this.send(this._config.subscription);
    }
  }
  
  private handleMessage(event: MessageEvent): void {
    try {
      this.lastMessageTime = Date.now();
      const data = JSON.parse(event.data);
      
      // Reset ping timeout if we get a pong
      if (data.pong || (data.ping && this.pingTimeout)) {
        clearTimeout(this.pingTimeout);
        this.pingTimeout = null;
        return;
      }
      
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
      else if (data.price !== undefined && data.timestamp !== undefined) {
        tickData = {
          timestamp: new Date(data.timestamp).toISOString(),
          value: Number(data.price.toFixed(5)),
          market: data.market || 'unknown'
        };
      }
      
      if (tickData) {
        this.ticks = [...this.ticks.slice(-99), tickData];
        this.emitEvent('tick', tickData);
      }
      
    } catch (err) {
      console.error('[WebSocketService] Error parsing WebSocket message:', err, event.data);
      this.emitEvent('error', err);
    }
  }
  
  private handleError(event: Event): void {
    console.error('[WebSocketService] WebSocket error:', event);
    this.connectionStatus = 'error';
    this.emitEvent('statusChange', this.connectionStatus);
    this.emitEvent('error', event);
  }
  
  private handleClose(event: CloseEvent): void {
    console.log('[WebSocketService] WebSocket closed:', event.code, event.reason);
    this.cleanup(); // Clear all timers
    
    this.connectionStatus = 'disconnected';
    this.emitEvent('statusChange', this.connectionStatus);
    this.emitEvent('close', event);
    
    // Attempt to reconnect if auto-reconnect is enabled
    if (this.autoReconnect) {
      this.scheduleReconnect();
    }
  }
  
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocketService] Max reconnect attempts reached');
      return;
    }
    
    const delay = Math.min(30000, 5000 * Math.pow(1.5, this.reconnectAttempts));
    console.log(`[WebSocketService] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
  
  private emitEvent(event: string, data: any): void {
    this.eventEmitter.emit(event, data);
  }
}

// Create a singleton instance with default config
export const webSocketService = new WebSocketService();

// Initialize connection on service creation
window.addEventListener('load', () => {
  webSocketService.connect();
});
