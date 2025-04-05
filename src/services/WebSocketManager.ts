
import { toast } from 'sonner';
import { webSocketService } from './WebSocketService';
import { TickData } from '@/types/chartTypes';
import { BrowserEventEmitter } from '@/lib/utils';

/**
 * Singleton service that manages the global WebSocket connection.
 * This ensures a single, persistent connection across the entire app.
 */
class WebSocketManager {
  private static instance: WebSocketManager;
  private eventEmitter = new BrowserEventEmitter();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectInterval = 5000; // 5 seconds
  private maxReconnectAttempts = 10;
  private reconnectAttempts = 0;
  private connectionMonitorInterval: NodeJS.Timeout | null = null;
  private lastMessageTime = Date.now();
  private tickBuffer: TickData[] = [];
  private isBufferingEnabled = true;
  private maxBufferSize = 1000;
  
  // Default connection config
  private config = {
    url: "wss://ws.binaryws.com/websockets/v3?app_id=70997",
    apiKey: "7KKDlK9AUf3WNM3",
    subscription: { ticks: 'R_10' }
  };

  private constructor() {
    // Initialize the connection monitor
    this.startConnectionMonitor();
    
    // Initial connection
    this.connect();
    
    // Listen for page visibility changes to handle mobile/tab switching
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }
    
    // Set up event listeners for the WebSocket service
    webSocketService.on('tick', this.handleTick);
    webSocketService.on('message', this.handleMessage);
    webSocketService.on('error', this.handleError);
    webSocketService.on('statusChange', this.handleStatusChange);
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }
  
  // Handle visibility change (tab switching, minimizing browser)
  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('[WebSocketManager] Page visible, checking connection');
      if (!webSocketService.isConnected()) {
        this.connect();
      }
    } else {
      console.log('[WebSocketManager] Page hidden, connection will be maintained');
    }
  };
  
  // Handle browser going online
  private handleOnline = () => {
    console.log('[WebSocketManager] Network online, reconnecting');
    this.connect();
  };
  
  // Handle browser going offline
  private handleOffline = () => {
    console.log('[WebSocketManager] Network offline, will reconnect when online');
    // We don't disconnect here, just let the WebSocket try to reconnect naturally
  };
  
  // Handle before unload to clean up
  private handleBeforeUnload = () => {
    console.log('[WebSocketManager] Page unloading, clearing timers');
    this.stopConnectionMonitor();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
  };
  
  // Connection monitor to ensure we're always connected
  private startConnectionMonitor() {
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
    }
    
    this.connectionMonitorInterval = setInterval(() => {
      // Check if connection is lost or if we haven't received data for too long
      if (!webSocketService.isConnected()) {
        console.log('[WebSocketManager] Connection lost, reconnecting...');
        this.connect();
      } else {
        // Check for stale connection (no messages in 30 seconds)
        const now = Date.now();
        if (now - this.lastMessageTime > 30000) {
          console.log('[WebSocketManager] Connection stale, reconnecting...');
          webSocketService.disconnect();
          this.connect();
        }
      }
    }, 10000); // Check every 10 seconds
  }
  
  private stopConnectionMonitor() {
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
      this.connectionMonitorInterval = null;
    }
  }
  
  private handleTick = (tick: TickData) => {
    this.lastMessageTime = Date.now();
    
    // Buffer ticks if needed
    if (this.isBufferingEnabled) {
      this.tickBuffer.push(tick);
      // Trim buffer if it gets too large
      if (this.tickBuffer.length > this.maxBufferSize) {
        this.tickBuffer.shift();
      }
    }
    
    // Forward to subscribers
    this.eventEmitter.emit('tick', tick);
  };
  
  private handleMessage = (data: any) => {
    this.lastMessageTime = Date.now();
    this.eventEmitter.emit('message', data);
  };
  
  private handleError = (error: any) => {
    console.error('[WebSocketManager] Error:', error);
    this.eventEmitter.emit('error', error);
    this.scheduleReconnect();
  };
  
  private handleStatusChange = (status: string) => {
    if (status === 'connected') {
      this.reconnectAttempts = 0;
      console.log('[WebSocketManager] Connected successfully');
      
      // Resubscribe to market data
      webSocketService.send(this.config.subscription);
    }
    
    this.eventEmitter.emit('statusChange', status);
  };
  
  private scheduleReconnect() {
    // Only schedule a reconnect if we're not already reconnecting
    if (this.reconnectTimer) {
      return;
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocketManager] Max reconnect attempts reached, giving up');
      toast.error('Unable to connect to market data service. Please refresh the page.');
      return;
    }
    
    this.reconnectAttempts++;
    
    // Use exponential backoff for reconnection
    const delay = Math.min(30000, this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1));
    
    console.log(`[WebSocketManager] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
  
  // Public API
  
  public connect() {
    if (webSocketService.isConnected()) {
      console.log('[WebSocketManager] Already connected');
      return true;
    }
    
    // Update the WebSocket service config
    webSocketService.updateConfig({
      url: this.config.url,
      subscription: this.config.subscription
    });
    
    // Connect
    const result = webSocketService.connect();
    
    if (!result) {
      this.scheduleReconnect();
    }
    
    return result;
  }
  
  public updateConfig(newConfig: Partial<typeof this.config>) {
    this.config = { ...this.config, ...newConfig };
    
    // Update the WebSocket service with new config
    webSocketService.updateConfig({
      url: this.config.url,
      subscription: this.config.subscription
    });
    
    // Re-send subscription if connected
    if (webSocketService.isConnected()) {
      webSocketService.send(this.config.subscription);
    }
  }
  
  public setSubscription(subscription: object) {
    this.config.subscription = subscription;
    webSocketService.setSubscription(subscription);
  }
  
  public getStatus() {
    return webSocketService.getStatus();
  }
  
  public isConnected() {
    return webSocketService.isConnected();
  }
  
  public hasRecentData() {
    return webSocketService.hasRecentData();
  }
  
  public getTicks() {
    return webSocketService.getTicks();
  }
  
  public getLatestTick() {
    return webSocketService.getLatestTick();
  }
  
  public getBufferedTicks() {
    return [...this.tickBuffer];
  }
  
  public clearBuffer() {
    this.tickBuffer = [];
  }
  
  public setBuffering(enabled: boolean) {
    this.isBufferingEnabled = enabled;
  }
  
  // Event listeners
  public on(event: string, callback: Function) {
    this.eventEmitter.on(event, callback);
  }
  
  public off(event: string, callback: Function) {
    this.eventEmitter.off(event, callback);
  }
  
  // Send a message to the WebSocket
  public send(message: object | string) {
    return webSocketService.send(message);
  }
}

// Export a singleton instance
export const wsManager = WebSocketManager.getInstance();
export default wsManager;
