import { toast } from 'sonner';
import { BrowserEventEmitter } from '@/lib/utils';
import { TickData } from '@/types/chartTypes';

class PersistentWebSocketService extends BrowserEventEmitter {
  private socket: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private autoReconnect: boolean = true;
  private maxReconnectAttempts: number = 10;
  private reconnectAttempts: number = 0;
  private lastMessageTime: number = 0;
  private ticks: TickData[] = [];
  private tickBuffer: TickData[] = [];
  private maxBufferSize: number = 2000;
  private isBufferingEnabled: boolean = true;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private pingTimeout: NodeJS.Timeout | null = null;
  private url: string = "wss://ws.binaryws.com/websockets/v3?app_id=70997";
  private subscription: object = { ticks: 'R_10' };
  
  constructor() {
    super();
    
    // Initialize the connection on page load
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => this.connect());
      
      // Setup visibility change handlers
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }
    
    // Start connection monitor to ensure connection is maintained
    this.startConnectionMonitor();
  }
  
  // Set WebSocket URL
  public setUrl(url: string): void {
    if (url === this.url) return;
    
    this.url = url;
    
    // Reconnect if already connected
    if (this.isConnected()) {
      this.disconnect();
      setTimeout(() => this.connect(), 300);
    }
  }
  
  // Set subscription
  public setSubscription(subscription: object): void {
    if (JSON.stringify(subscription) === JSON.stringify(this.subscription)) return;
    
    this.subscription = subscription;
    
    // Send subscription if connected
    if (this.isConnected()) {
      this.send(subscription);
    }
  }
  
  // Get current subscription
  public getSubscription(): object {
    return { ...this.subscription };
  }
  
  // Connect to WebSocket
  public connect(): boolean {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return false; // Already connected or connecting
    }
    
    // Clean up
    this.cleanup();
    
    this.connectionStatus = 'connecting';
    this.emit('statusChange', this.connectionStatus);
    
    try {
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      
      return true;
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      this.handleError(err as Event);
      return false;
    }
  }
  
  // Disconnect from WebSocket
  public disconnect(): boolean {
    this.autoReconnect = false;
    this.cleanup();
    
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      try {
        this.socket.close();
      } catch (e) {
        console.error('Error closing WebSocket:', e);
      }
    }
    
    this.socket = null;
    this.connectionStatus = 'disconnected';
    this.emit('statusChange', this.connectionStatus);
    
    return true;
  }
  
  // Send message to WebSocket
  public send(message: object | string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }
    
    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(messageStr);
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    }
  }
  
  // Get connection status
  public getStatus(): string {
    return this.connectionStatus;
  }
  
  // Check if connected
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  // Get ticks
  public getTicks(): TickData[] {
    return [...this.ticks];
  }
  
  // Get latest tick
  public getLatestTick(): TickData | null {
    return this.ticks.length > 0 ? this.ticks[this.ticks.length - 1] : null;
  }
  
  // Get buffered ticks
  public getBufferedTicks(): TickData[] {
    return [...this.tickBuffer];
  }
  
  // Clear buffer
  public clearBuffer(): void {
    this.tickBuffer = [];
  }
  
  // Check if has recent data
  public hasRecentData(): boolean {
    const lastTick = this.getLatestTick();
    if (!lastTick) return false;
    
    const tickTime = typeof lastTick.timestamp === 'string' 
      ? new Date(lastTick.timestamp).getTime()
      : Number(lastTick.timestamp);
      
    return (Date.now() - tickTime) < 10000; // 10 seconds
  }
  
  // Handle WebSocket open
  private handleOpen(): void {
    console.log('WebSocket connected');
    this.connectionStatus = 'connected';
    this.emit('statusChange', this.connectionStatus);
    this.emit('open');
    
    this.reconnectAttempts = 0;
    this.lastMessageTime = Date.now();
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Send subscription
    if (Object.keys(this.subscription).length > 0) {
      this.send(this.subscription);
    }
  }
  
  // Handle WebSocket message
  private handleMessage(event: MessageEvent): void {
    try {
      this.lastMessageTime = Date.now();
      const data = JSON.parse(event.data);
      
      // Reset ping timeout if we get a pong
      if (data.pong || (data.ping && this.pingTimeout)) {
        if (this.pingTimeout) {
          clearTimeout(this.pingTimeout);
          this.pingTimeout = null;
        }
        return;
      }
      
      this.emit('message', data);
      
      // Handle tick data
      let tickData: TickData | null = null;
      
      if (data.tick) {
        tickData = {
          timestamp: new Date(data.tick.epoch * 1000).toISOString(),
          value: Number(data.tick.quote.toFixed(5)),
          market: data.tick.symbol,
          symbol: data.tick.symbol
        };
      }
      else if (data.s && data.p) {
        tickData = {
          timestamp: new Date().toISOString(),
          value: Number(parseFloat(data.p).toFixed(5)),
          market: data.s,
          symbol: data.s
        };
      }
      else if (data.symbol && data.price) {
        tickData = {
          timestamp: new Date().toISOString(),
          value: Number(data.price.toFixed(5)),
          market: data.symbol,
          symbol: data.symbol
        };
      }
      else if (data.price !== undefined && data.timestamp !== undefined) {
        tickData = {
          timestamp: new Date(data.timestamp).toISOString(),
          value: Number(data.price.toFixed(5)),
          market: data.market || 'unknown',
          symbol: data.market || 'unknown'
        };
      }
      
      if (tickData) {
        // Keep only the last 100 ticks in the main array
        this.ticks = [...this.ticks.slice(-99), tickData];
        
        // Add to buffer if buffering is enabled
        if (this.isBufferingEnabled) {
          this.tickBuffer.push(tickData);
          // Trim buffer if it gets too large
          if (this.tickBuffer.length > this.maxBufferSize) {
            this.tickBuffer.shift();
          }
        }
        
        this.emit('tick', tickData);
      }
      
    } catch (err) {
      console.error('Error parsing WebSocket message:', err, event.data);
    }
  }
  
  // Handle WebSocket error
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.connectionStatus = 'error';
    this.emit('statusChange', this.connectionStatus);
    this.emit('error', event);
  }
  
  // Handle WebSocket close
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason);
    this.cleanup();
    
    this.connectionStatus = 'disconnected';
    this.emit('statusChange', this.connectionStatus);
    this.emit('close', event);
    
    // Attempt to reconnect if auto-reconnect is enabled
    if (this.autoReconnect) {
      this.scheduleReconnect();
    }
  }
  
  // Schedule reconnect
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      toast.error('Unable to connect to market data. Please refresh the page.');
      return;
    }
    
    const delay = Math.min(30000, 5000 * Math.pow(1.5, this.reconnectAttempts));
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
  
  // Clean up timers
  private cleanup(): void {
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
  
  // Start heartbeat
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ ping: 1 });
        
        if (this.pingTimeout) {
          clearTimeout(this.pingTimeout);
        }
        
        this.pingTimeout = setTimeout(() => {
          console.log('Ping timeout, reconnecting');
          this.disconnect();
          this.autoReconnect = true;
          this.connect();
        }, 5000);
      }
    }, 30000);
  }
  
  // Start connection monitor
  private startConnectionMonitor(): void {
    setInterval(() => {
      if (!this.isConnected()) {
        console.log('Connection lost, reconnecting...');
        this.connect();
      } else {
        // Check for stale connection (no messages in 30 seconds)
        const now = Date.now();
        if (now - this.lastMessageTime > 30000) {
          console.log('Connection stale, reconnecting...');
          this.disconnect();
          this.autoReconnect = true;
          this.connect();
        }
      }
    }, 30000);
  }
  
  // Visibility change handler
  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('Page visible, checking connection');
      if (!this.isConnected()) {
        this.connect();
      }
    } else {
      console.log('Page hidden, connection will be maintained');
    }
  };
  
  // Online handler
  private handleOnline = () => {
    console.log('Network online, reconnecting');
    this.connect();
  };
  
  // Offline handler
  private handleOffline = () => {
    console.log('Network offline, will reconnect when online');
  };
  
  // Before unload handler
  private handleBeforeUnload = () => {
    console.log('Page unloading, clearing timers');
    this.cleanup();
  };
}

// Create a singleton instance
export const persistentWebSocket = new PersistentWebSocketService();
export default persistentWebSocket;

// Make the service available globally for debugging
if (typeof window !== 'undefined') {
  window.persistentWebSocket = persistentWebSocket;
}
