import { EventEmitter } from 'events';

interface TickData {
  epoch: number;
  id: string;
  quote: number;
  symbol: string;
}

interface BrokerWebSocket {
  url: string;
  subscription: object;
}

const brokerWebSockets: { [key: string]: BrokerWebSocket } = {
  binary: {
    url: 'wss://ws.binaryws.com/websockets/v3?app_id=1089',
    subscription: { ticks: 'R_10' }
  },
  // Add more broker configurations here
};

export class WebSocketService extends EventEmitter {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private isConnectedVar = false;
  private connectionStatus: string = 'disconnected';
  private ticks: TickData[] = [];
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

    this.socket = new WebSocket(this._config.url);
    this.socket.onopen = this.handleOpen;
    this.socket.onmessage = this.handleMessage;
    this.socket.onclose = this.handleClose;
    this.socket.onerror = this.handleError;
    this.updateStatus('connecting');
  }

  reconnect(): void {
    if (this.reconnectAttempts >= (this._config.maxReconnectAttempts || 5)) {
      console.warn('Max reconnect attempts reached.');
      this.updateStatus('disconnected');
      return;
    }

    if (this.socket) {
      this.socket.close();
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts})...`);
    this.updateStatus('reconnecting');
    setTimeout(this.connect, this._config.reconnectInterval || 3000);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnectedVar = false;
      this.updateStatus('disconnected');
      console.log('WebSocket disconnected.');
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
    }
  }

  handleOpen(): void {
    this.isConnectedVar = true;
    this.reconnectAttempts = 0;
    console.log('WebSocket connected.');
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
          epoch: data.tick.epoch,
          id: data.tick.id,
          quote: data.tick.quote,
          symbol: data.tick.symbol
        };
        
        this.ticks.push(tick);
        if (this.ticks.length > this.maxTicks) {
          this.ticks.shift(); // Remove the oldest tick
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
  }
  
  setSubscription(subscription: object): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this._config.subscription = subscription;
      this.send(subscription);
      console.log('WebSocket subscription sent:', subscription);
    } else {
      console.warn('WebSocket is not connected. Subscription not set.');
      this.emit('error', new Error('WebSocket is not connected. Subscription not set.'));
    }
  }
  
  updateConfig(options: {
    url?: string;
    apiKey?: string;
    subscription?: object;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
  }): void {
    this._config = { ...this._config, ...options };
    
    // If WebSocket is connected, disconnect and reconnect with new config
    if (this.isConnected()) {
      this.reconnect();
    }
  }

  getTicks(): TickData[] {
    return [...this.ticks];
  }

  getLatestTick(): TickData | null {
    if (this.ticks.length > 0) {
      return this.ticks[this.ticks.length - 1];
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
export type { TickData } from '@/types/chartTypes';
export { brokerWebSockets };
