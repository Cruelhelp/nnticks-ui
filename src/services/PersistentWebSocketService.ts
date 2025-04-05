
import { BrowserEventEmitter } from '@/lib/utils';

export interface TickData {
  value: number;
  market: string;
  timestamp: number;
}

export class PersistentWebSocketService extends BrowserEventEmitter {
  private socket: WebSocket | null = null;
  private url: string = 'wss://ws.binaryws.com/websockets/v3?app_id=70997';
  private autoReconnect: boolean = true;
  private reconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private pingInterval: number = 10000;
  private pingTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private lastMessageTime: number = 0;
  private subscription: Record<string, any> = { ticks: 'R_10' };
  private tickBuffer: TickData[] = [];
  private maxBufferSize: number = 100;
  private status: string = 'disconnected';
  private recentDataThreshold: number = 10000; // 10 seconds
  private lastTickTime: number = 0;
  
  constructor() {
    super();
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    
    // Add event listeners for page visibility and unload
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }
    
    // Try to restore the connection on initialization
    this.initialize();
  }
  
  // Initialize the service
  private initialize(): void {
    console.info('[PersistentWebSocketService] Initialized');
    
    // Check if there's a saved subscription in localStorage
    const savedSubscription = localStorage.getItem('ws_subscription');
    if (savedSubscription) {
      try {
        this.subscription = JSON.parse(savedSubscription);
      } catch (e) {
        console.error('Failed to parse saved subscription:', e);
      }
    }
    
    // Auto-connect if we should be connected
    if (localStorage.getItem('ws_should_connect') === 'true') {
      this.connect();
    }
  }
  
  // Set the WebSocket URL
  public setUrl(url: string): void {
    if (this.url !== url) {
      this.url = url;
      
      // If we're already connected, reconnect with the new URL
      if (this.isConnected()) {
        this.disconnect();
        this.connect();
      }
    }
  }
  
  // Connect to the WebSocket server
  public connect(): boolean {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.info('[PersistentWebSocketService] Already connected or connecting');
      return false;
    }
    
    // Set the should_connect flag in localStorage
    localStorage.setItem('ws_should_connect', 'true');
    
    try {
      console.info(`[PersistentWebSocketService] Connecting to ${this.url}`);
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      
      this.updateStatus('connecting');
      return true;
    } catch (error) {
      console.error('[PersistentWebSocketService] Connection error:', error);
      this.updateStatus('error');
      this.scheduleReconnect();
      return false;
    }
  }
  
  // Disconnect from the WebSocket server
  public disconnect(): void {
    this.stopPingTimer();
    this.cancelReconnect();
    
    localStorage.setItem('ws_should_connect', 'false');
    
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {
        console.error('[PersistentWebSocketService] Error closing socket:', e);
      }
      this.socket = null;
    }
    
    this.updateStatus('disconnected');
  }
  
  // Send a message to the WebSocket server
  public send(message: any): boolean {
    if (!this.isConnected()) {
      console.warn('[PersistentWebSocketService] Cannot send message: not connected');
      return false;
    }
    
    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket!.send(messageString);
      return true;
    } catch (error) {
      console.error('[PersistentWebSocketService] Error sending message:', error);
      return false;
    }
  }
  
  // Set the subscription
  public setSubscription(subscription: Record<string, any>): void {
    // Ensure the subscription has the required ticks property
    if (!subscription.ticks && !subscription.ticks_history) {
      console.warn('[PersistentWebSocketService] Subscription must include ticks or ticks_history');
      if (!Object.keys(subscription).length) {
        // Empty subscription, default to R_10
        subscription = { ticks: 'R_10' };
      }
    }
    
    // If we're already subscribed to something, unsubscribe first
    if (this.isConnected() && this.subscription.ticks) {
      this.send({ forget_all: 'ticks' });
    }
    
    this.subscription = subscription;
    
    // Save subscription to localStorage
    localStorage.setItem('ws_subscription', JSON.stringify(subscription));
    
    // If we're connected, send the new subscription
    if (this.isConnected()) {
      this.send(subscription);
    }
  }
  
  // Check if the WebSocket is connected
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  // Get the current status
  public getStatus(): string {
    return this.status;
  }
  
  // Get the current subscription
  public getSubscription(): Record<string, any> {
    return { ...this.subscription };
  }
  
  // Get the buffered ticks
  public getTicks(): TickData[] {
    return [...this.tickBuffer];
  }
  
  // Get the latest tick
  public getLatestTick(): TickData | null {
    return this.tickBuffer.length > 0 ? this.tickBuffer[this.tickBuffer.length - 1] : null;
  }
  
  // Check if we've received data recently
  public hasRecentData(): boolean {
    if (this.lastTickTime === 0) return false;
    return Date.now() - this.lastTickTime < this.recentDataThreshold;
  }
  
  // Clear the tick buffer
  public clearBuffer(): void {
    this.tickBuffer = [];
  }
  
  // Get a copy of the buffered ticks
  public getBufferedTicks(): TickData[] {
    return [...this.tickBuffer];
  }
  
  // Handle WebSocket open event
  private handleOpen(): void {
    console.info('[PersistentWebSocketService] Connected successfully');
    this.reconnectAttempts = 0;
    this.updateStatus('connected');
    
    // Subscribe to the configured data
    if (Object.keys(this.subscription).length > 0) {
      this.send(this.subscription);
    }
    
    // Start ping timer
    this.startPingTimer();
    
    // Emit the open event
    this.emit('open');
    this.emit('statusChange', 'connected');
  }
  
  // Handle WebSocket message event
  private handleMessage(event: MessageEvent): void {
    this.lastMessageTime = Date.now();
    
    try {
      const data = JSON.parse(event.data);
      
      // Handle ping/pong
      if (data.ping) {
        this.send({ pong: data.ping });
        return;
      }
      
      // Handle tick data
      if (data.tick) {
        const tick: TickData = {
          value: data.tick.quote,
          market: data.tick.symbol,
          timestamp: data.tick.epoch * 1000 // Convert to milliseconds
        };
        
        // Add to buffer and emit event
        this.addTickToBuffer(tick);
        this.lastTickTime = Date.now();
        this.emit('tick', tick);
      }
      
      // Emit the general message event
      this.emit('message', data);
    } catch (error) {
      console.error('[PersistentWebSocketService] Error parsing message:', error);
    }
  }
  
  // Handle WebSocket close event
  private handleClose(event: CloseEvent): void {
    console.info('[PersistentWebSocketService] Connection closed:', event.code, event.reason);
    this.socket = null;
    this.stopPingTimer();
    
    this.updateStatus('disconnected');
    this.emit('close', event);
    this.emit('statusChange', 'disconnected');
    
    // Try to reconnect if auto-reconnect is enabled
    if (this.autoReconnect && localStorage.getItem('ws_should_connect') === 'true') {
      this.scheduleReconnect();
    }
  }
  
  // Handle WebSocket error event
  private handleError(event: Event): void {
    console.error('[PersistentWebSocketService] WebSocket error:', event);
    this.updateStatus('error');
    this.emit('error', event);
    this.emit('statusChange', 'error');
  }
  
  // Handle page visibility change
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      console.info('[PersistentWebSocketService] Page visible, checking connection');
      
      // If we should be connected but aren't, reconnect
      if (localStorage.getItem('ws_should_connect') === 'true' && !this.isConnected()) {
        this.connect();
      }
    } else {
      console.info('[PersistentWebSocketService] Page hidden, connection will be maintained');
    }
  }
  
  // Handle before unload
  private handleBeforeUnload(): void {
    console.info('[PersistentWebSocketService] Page unloading');
    // We don't disconnect here to keep the connection persistent
    // Just save the current state
    if (this.isConnected()) {
      localStorage.setItem('ws_should_connect', 'true');
    }
  }
  
  // Schedule a reconnection attempt
  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null || !this.autoReconnect) {
      return;
    }
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.maxReconnectDelay,
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts)
    );
    
    console.info(`[PersistentWebSocketService] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      
      // Check if we've reached the max number of attempts
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[PersistentWebSocketService] Max reconnect attempts reached');
        this.updateStatus('disconnected');
        localStorage.setItem('ws_should_connect', 'false');
        return;
      }
      
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
  
  // Cancel any pending reconnection
  private cancelReconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  // Start the ping timer
  private startPingTimer(): void {
    this.stopPingTimer(); // Clear any existing timer
    
    this.pingTimer = setInterval(() => {
      if (this.isConnected()) {
        // Send a ping
        this.send({ ping: 1 });
        
        // Check if we've received a message recently
        const timeSinceLastMessage = Date.now() - this.lastMessageTime;
        if (timeSinceLastMessage > this.pingInterval * 3) {
          console.warn(`[PersistentWebSocketService] No response for ${timeSinceLastMessage}ms, reconnecting`);
          this.reconnect();
        }
      }
    }, this.pingInterval);
  }
  
  // Stop the ping timer
  private stopPingTimer(): void {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
  
  // Force a reconnection
  private reconnect(): void {
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {
        console.error('[PersistentWebSocketService] Error closing socket for reconnect:', e);
      }
      this.socket = null;
    }
    
    this.connect();
  }
  
  // Update the status and emit an event
  private updateStatus(status: string): void {
    if (this.status !== status) {
      this.status = status;
      this.emit('statusChange', status);
    }
  }
  
  // Add a tick to the buffer
  private addTickToBuffer(tick: TickData): void {
    this.tickBuffer.push(tick);
    
    // Trim the buffer if it exceeds the max size
    if (this.tickBuffer.length > this.maxBufferSize) {
      this.tickBuffer = this.tickBuffer.slice(-this.maxBufferSize);
    }
  }
  
  // Clean up when the service is destroyed
  public destroy(): void {
    this.disconnect();
    
    // Remove event listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }
  }
}

// Create a singleton instance
export const persistentWebSocket = new PersistentWebSocketService();
