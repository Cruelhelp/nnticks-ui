
import { BrowserEventEmitter } from '@/lib/BrowserEventEmitter';
import { TickData, brokerWebSockets } from '@/types/chartTypes';

interface BrokerWebSocket {
  url: string;
  subscription: { ticks: string };
}

export class WebSocketService extends BrowserEventEmitter {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private isConnectedVar = false;
  private connectionStatus: string = 'disconnected';
  private ticksData: TickData[] = [];
  private maxTicks = 20;
  private lastActivity: number = Date.now();
  
  // Change private config to private _config
  private _config = {
    url: "wss://ws.binaryws.com/websockets/v3?app_id=1089",
    apiKey: "nPAKsP8mJBuLkvW",
    subscription: { ticks: 'R_10' },
    reconnectInterval: 3000,
    maxReconnectAttempts: 5
  };
  
  // Add a public getter for config (read-only)
  public getConfig() {
    return { ...this._config };
  }
  
  constructor() {
    super();
    this.connect = this.connect.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
    this.setSubscription = this.setSubscription.bind(this);
    this.updateConfig = this.updateConfig.bind(this);
    this.getTicks = this.getTicks.bind(this);
    this.getLatestTick = this.getLatestTick.bind(this);
    this.isConnected = this.isConnected.bind(this);
    this.getStatus = this.getStatus.bind(this);
    this.hasRecentData = this.hasRecentData.bind(this);
  }
  
  connect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected.');
      return;
    }

    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      console.log('WebSocket is connecting or already connected/connecting. readyState:', this.socket.readyState);
      return;
    }
    
    if (!this._config.url) {
      console.error('WebSocket URL is not defined.');
      this.updateStatus('error');
      this.emit('error', new Error('WebSocket URL is not defined.'));
      return;
    }

    // Explicitly close any existing connection before creating a new one
    if (this.socket) {
      try {
        this.socket.close();
        this.socket = null;
      } catch (err) {
        console.error('Error closing existing socket:', err);
      }
    }

    try {
      this.socket = new WebSocket(this._config.url);
      this.socket.onopen = this.handleOpen;
      this.socket.onmessage = this.handleMessage;
      this.socket.onclose = this.handleClose;
      this.socket.onerror = this.handleError;
      this.updateStatus('connecting');
      console.log('WebSocket connecting to:', this._config.url);
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.updateStatus('error');
      this.emit('error', error);
    }
  }

  reconnect(): void {
    if (this.reconnectAttempts >= (this._config.maxReconnectAttempts || 5)) {
      console.warn('Max reconnect attempts reached.');
      this.updateStatus('disconnected');
      this.reconnectAttempts = 0; // Reset for future reconnect attempts
      return;
    }

    if (this.socket) {
      try {
        this.socket.close();
        this.socket = null;
      } catch (err) {
        console.error('Error closing socket during reconnect:', err);
      }
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts})...`);
    this.updateStatus('reconnecting');
    setTimeout(this.connect, this._config.reconnectInterval || 3000);
  }

  disconnect(): void {
    if (this.socket) {
      try {
        this.socket.close();
        this.socket = null;
        this.isConnectedVar = false;
        this.updateStatus('disconnected');
        console.log('WebSocket disconnected.');
      } catch (error) {
        console.error('Error during disconnect:', error);
      }
    }
  }

  send(message: object | string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(payload);
      console.log('WebSocket message sent:', payload);
    } else {
      console.warn('WebSocket is not connected. Message not sent.');
      this.emit('error', new Error('WebSocket is not connected. Message not sent.'));
      // Try to reconnect if not connected
      this.reconnect();
    }
  }

  handleOpen(): void {
    this.isConnectedVar = true;
    this.reconnectAttempts = 0;
    console.log('WebSocket connected successfully.');
    this.updateStatus('connected');
    
    // Subscribe immediately after opening
    if (this._config.subscription) {
      this.setSubscription(this._config.subscription);
    }
  }

  handleMessage(event: MessageEvent): void {
    this.lastActivity = Date.now();
    try {
      const data = JSON.parse(event.data);
      this.emit('message', data);
      
      if (data.tick) {
        const tick: TickData = {
          timestamp: new Date(data.tick.epoch * 1000).toLocaleTimeString(),
          value: data.tick.quote,
          market: data.tick.symbol || 'unknown'
        };
        
        this.ticksData.push(tick);
        if (this.ticksData.length > this.maxTicks) {
          this.ticksData.shift(); // Remove the oldest tick
        }
        
        this.emit('tick', tick);
      }
    } catch (error) {
      console.error('Failed to parse message data:', error);
      this.emit('error', error);
    }
  }

  handleClose(event: CloseEvent): void {
    this.isConnectedVar = false;
    this.updateStatus('disconnected');
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.emit('close', event);

    // Only attempt to reconnect if the disconnection was not initiated by the client
    if (event.code !== 1000) {
      this.reconnect();
    }
  }

  handleError(error: Event): void {
    this.isConnectedVar = false;
    this.updateStatus('error');
    console.error('WebSocket error:', error);
    this.emit('error', error);
    
    // Attempt to reconnect on error
    this.reconnect();
  }
  
  setSubscription(subscription: { ticks: string }): void {
    if (!subscription || typeof subscription.ticks !== 'string') {
      console.error('Invalid subscription format:', subscription);
      return;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this._config.subscription = subscription;
      this.send({ ticks: subscription.ticks });
      console.log('WebSocket subscription sent:', subscription);
    } else {
      console.warn('WebSocket is not connected. Setting subscription for next connection.');
      this._config.subscription = subscription;
      // Try to reconnect
      this.reconnect();
    }
  }
  
  updateConfig(options: {
    url?: string;
    apiKey?: string;
    subscription?: { ticks: string };
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
  }): void {
    // Validate subscription if provided
    if (options.subscription && !options.subscription.ticks) {
      console.error('Invalid subscription format:', options.subscription);
      return;
    }

    // Update config
    this._config = { 
      ...this._config, 
      ...options,
      subscription: options.subscription ? options.subscription : this._config.subscription
    };
    
    console.log('WebSocket config updated:', this._config);
    
    // If WebSocket is connected, disconnect and reconnect with new config
    if (this.socket) {
      this.disconnect();
      setTimeout(() => this.connect(), 500); // Give some time before reconnecting
    }
  }

  getTicks(): TickData[] {
    return [...this.ticksData];
  }

  getLatestTick(): TickData | null {
    if (this.ticksData.length > 0) {
      return this.ticksData[this.ticksData.length - 1];
    }
    return null;
  }

  isConnected(): boolean {
    return this.isConnectedVar;
  }

  getStatus(): string {
    return this.connectionStatus;
  }
  
  private updateStatus(status: string): void {
    this.connectionStatus = status;
    this.emit('statusChange', status);
  }
  
  hasRecentData(): boolean {
    const now = Date.now();
    return (now - this.lastActivity) < 5000; // Consider recent if last activity was within 5 seconds
  }
}

export const webSocketService = new WebSocketService();
export { brokerWebSockets };
