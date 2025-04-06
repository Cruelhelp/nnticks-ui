import { BrowserEventEmitter } from '@/lib/utils';
import { TickData } from '@/types/tickTypes';

const WEBSOCKET_URL = 'wss://ws.binaryws.com/websockets/v3';

export class WebSocketService extends BrowserEventEmitter {
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 2000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastMessageTime: number = 0;
  private activeSymbols: string[] = ['R_10'];
  private ticks: TickData[] = [];
  private latestTick: TickData | null = null;

  constructor() {
    super();
    this.setupBeforeUnloadListener();
  }

  public connect(): boolean {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return true;
    }

    try {
      this.socket = new WebSocket(WEBSOCKET_URL);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      
      return true;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      return false;
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.clearTimers();
    this.isConnected = false;
    this.emit('statusChange', { connected: false });
  }

  public reconnect(): void {
    this.disconnect();
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }
      
      this.reconnectTimer = setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect();
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnect attempts reached. Please reconnect manually.');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  public subscribeToTicks(symbols: string[] = ['R_10']): void {
    if (!this.isConnected || !this.socket) {
      this.connect();
      this.activeSymbols = symbols;
      return;
    }
    
    // Unsubscribe from current ticks first
    this.unsubscribeFromTicks();
    
    // Subscribe to new symbols
    this.activeSymbols = symbols;
    
    symbols.forEach(symbol => {
      const subscribeMsg = {
        ticks: symbol,
        subscribe: 1
      };
      
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(subscribeMsg));
      }
    });
  }

  public unsubscribeFromTicks(): void {
    if (!this.isConnected || !this.socket) return;
    
    this.activeSymbols.forEach(symbol => {
      const unsubscribeMsg = {
        forget_all: ['ticks'],
        ticks: symbol
      };
      
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(unsubscribeMsg));
      }
    });
  }

  public getStatus(): { connected: boolean; lastMessageTime: number } {
    return {
      connected: this.isConnected,
      lastMessageTime: this.lastMessageTime
    };
  }

  public getTicks(): TickData[] {
    return [...this.ticks];
  }

  public getLatestTick(): TickData | null {
    return this.latestTick;
  }

  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  private handleOpen(): void {
    console.log('WebSocket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.startPingInterval();
    this.emit('statusChange', { connected: true });
    
    // Subscribe to ticks for active symbols
    if (this.activeSymbols.length > 0) {
      this.subscribeToTicks(this.activeSymbols);
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      this.lastMessageTime = Date.now();
      
      if (data.tick) {
        const tickData: TickData = {
          timestamp: data.tick.epoch * 1000, // Convert to milliseconds
          value: data.tick.quote,
          market: data.tick.symbol,
          symbol: data.tick.symbol
        };
        
        this.processTick(tickData);
      } else if (data.ping) {
        this.handlePing();
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed with code ${event.code}: ${event.reason}`);
    this.isConnected = false;
    this.clearTimers();
    this.emit('statusChange', { connected: false });
    
    // Attempt to reconnect if not closed intentionally
    if (event.code !== 1000) {
      this.reconnect();
    }
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.emit('error', event);
  }

  private processTick(tick: TickData): void {
    // Update latest tick
    this.latestTick = tick;
    
    // Add to ticks array (limited to prevent memory issues)
    this.ticks.push(tick);
    if (this.ticks.length > 1000) {
      this.ticks = this.ticks.slice(-1000);
    }
    
    // Emit the tick event for subscribers
    this.emit('tick', tick);
  }

  private handlePing(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ pong: 1 }));
    }
  }

  private startPingInterval(): void {
    this.clearTimers();
    
    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ ping: 1 }));
      }
      
      // Check if we haven't received a message in a while
      const now = Date.now();
      if (this.lastMessageTime > 0 && now - this.lastMessageTime > 60000) {
        console.warn('No message received in 60 seconds, reconnecting...');
        this.reconnect();
      }
    }, 30000);
  }

  private clearTimers(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setupBeforeUnloadListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.unsubscribeFromTicks();
      });
    }
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
