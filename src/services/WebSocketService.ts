
import { toast } from 'sonner';

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
  url: "wss://ws.binaryws.com/websockets/v3?app_id=1089",
  apiKey: "nPAKsP8mJBuLkvW",
  subscription: { ticks: 'R_10' }
};

// Browser-compatible EventEmitter implementation
class BrowserEventEmitter {
  private events: Record<string, Function[]> = {};

  on(event: string, listener: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (err) {
        console.error(`Error in event listener for ${event}:`, err);
      }
    });
  }
}

export class WebSocketService {
  private _config: WSConfig;
  private socket: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private eventEmitter: BrowserEventEmitter = new BrowserEventEmitter();
  private autoReconnect: boolean = true;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;
  private lastMessageTime: number = 0;
  private ticks: TickData[] = [];
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  
  constructor(config: Partial<WSConfig> = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config };
  }

  // Add getter for config
  public get config(): WSConfig {
    return { ...this._config };
  }

  public updateConfig(config: Partial<WSConfig>): void {
    this._config = { ...this._config, ...config };
    
    // Reconnect if already connected to apply new config
    if (this.isConnected()) {
      this.disconnect();
      setTimeout(() => this.connect(), 100);
    }
  }

  public connect(): boolean {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return false; // Already connected or connecting
    }
    
    this.connectionStatus = 'connecting';
    this.emitEvent('statusChange', this.connectionStatus);
    
    try {
      console.log(`Connecting to WebSocket: ${this._config.url}`);
      this.socket = new WebSocket(this._config.url);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      
      return true;
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      this.handleError(err as Event);
      return false;
    }
  }

  public disconnect(): void {
    if (!this.socket) return;
    
    this.autoReconnect = false; // Prevent auto reconnect on manual disconnect
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
      this.socket.close();
    }
    
    this.socket = null;
    this.connectionStatus = 'disconnected';
    this.emitEvent('statusChange', this.connectionStatus);
  }

  public send(message: object | string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    this.socket.send(messageStr);
    return true;
  }

  public setSubscription(subscription: object): void {
    this._config.subscription = subscription;
    
    if (this.isConnected()) {
      this.send(subscription);
    }
  }

  public on(event: string, callback: Function): void {
    this.eventEmitter.on(event, callback);
  }

  public off(event: string, callback: Function): void {
    this.eventEmitter.off(event, callback);
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
    console.log('WebSocket connected');
    this.connectionStatus = 'connected';
    this.emitEvent('statusChange', this.connectionStatus);
    this.emitEvent('open', event);
    this.reconnectAttempts = 0;
    this.lastMessageTime = Date.now();
    
    // Send subscription
    if (this._config.subscription && Object.keys(this._config.subscription).length > 0) {
      this.send(this._config.subscription);
    }
  }
  
  private handleMessage(event: MessageEvent): void {
    try {
      this.lastMessageTime = Date.now();
      const data = JSON.parse(event.data);
      
      if (data.ping || data.heartbeat) {
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
      console.error('Error parsing WebSocket message:', err, event.data);
      this.emitEvent('error', err);
    }
  }
  
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.connectionStatus = 'error';
    this.emitEvent('statusChange', this.connectionStatus);
    this.emitEvent('error', event);
  }
  
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason);
    this.connectionStatus = 'disconnected';
    this.emitEvent('statusChange', this.connectionStatus);
    this.emitEvent('close', event);
    
    // Attempt to reconnect if auto-reconnect is enabled
    if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect in 5000ms (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, 5000);
    }
  }
  
  private emitEvent(event: string, data: any): void {
    this.eventEmitter.emit(event, data);
  }
}

// Create a singleton instance with default config
export const webSocketService = new WebSocketService();

// Initialize connection on service creation
webSocketService.connect();
