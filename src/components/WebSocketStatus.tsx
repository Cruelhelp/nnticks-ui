
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertTriangle, Activity, RefreshCw } from 'lucide-react';
import { persistentWebSocket } from '@/services/PersistentWebSocketService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface WebSocketStatusProps {
  className?: string;
  compact?: boolean;
  showTickInfo?: boolean;
  showControls?: boolean;
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  className,
  compact = false,
  showTickInfo = false,
  showControls = false
}) => {
  const [hasRecentData, setHasRecentData] = useState(persistentWebSocket.hasRecentData());
  const [isConnected, setIsConnected] = useState(persistentWebSocket.isConnected());
  const [connectionStatus, setConnectionStatus] = useState(persistentWebSocket.getStatus());
  const [tickCount, setTickCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  useEffect(() => {
    const updateStatus = () => {
      setHasRecentData(persistentWebSocket.hasRecentData());
      setIsConnected(persistentWebSocket.isConnected());
      setConnectionStatus(persistentWebSocket.getStatus());
    };
    
    const handleTick = () => {
      setTickCount(prev => prev + 1);
      updateStatus();
    };
    
    const handleStatusChange = (status: string) => {
      setConnectionStatus(status);
      setIsConnected(persistentWebSocket.isConnected());
      setHasRecentData(persistentWebSocket.hasRecentData());
      
      if (status === 'connected') {
        setIsReconnecting(false);
      }
    };
    
    // Initial update
    updateStatus();
    
    // Add event listeners
    persistentWebSocket.on('tick', handleTick);
    persistentWebSocket.on('statusChange', handleStatusChange);
    
    // Update status periodically
    const intervalId = setInterval(updateStatus, 2000);
    
    // Clean up
    return () => {
      persistentWebSocket.off('tick', handleTick);
      persistentWebSocket.off('statusChange', handleStatusChange);
      clearInterval(intervalId);
    };
  }, []);
  
  const handleReconnect = () => {
    setIsReconnecting(true);
    
    // Force reconnection
    persistentWebSocket.disconnect();
    
    setTimeout(() => {
      const success = persistentWebSocket.connect();
      if (success) {
        toast.success('Reconnecting to market data...');
      } else {
        toast.error('Failed to reconnect. Please try again.');
        setIsReconnecting(false);
      }
    }, 1000);
  };
  
  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Badge 
          variant={hasRecentData ? "success" : isConnected ? "outline" : "destructive"}
          className="flex items-center gap-1"
        >
          {hasRecentData && <Wifi className="h-3 w-3" />}
          {!hasRecentData && isConnected && <Wifi className="h-3 w-3 text-yellow-500" />}
          {!isConnected && <WifiOff className="h-3 w-3" />}
          {hasRecentData ? "ONLINE" : isConnected ? "CONNECTED" : "OFFLINE"}
          {showTickInfo && hasRecentData && <span className="ml-1 text-xs">({tickCount})</span>}
        </Badge>
        
        {showControls && (
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-7 w-7" 
            onClick={handleReconnect}
            disabled={isReconnecting}
          >
            <RefreshCw className={cn("h-3 w-3", isReconnecting && "animate-spin")} />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {hasRecentData ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-green-500 font-medium">ONLINE</span>
          {showTickInfo && <Activity className="h-3 w-3 ml-1 text-green-500" />}
          {showTickInfo && <span className="text-xs text-green-500">{tickCount} ticks</span>}
        </>
      ) : isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-yellow-500" />
          <span className="text-yellow-500 font-medium">CONNECTED</span>
        </>
      ) : connectionStatus === 'error' ? (
        <>
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-red-500 font-medium">ERROR</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-red-500 font-medium">OFFLINE</span>
        </>
      )}
      
      {showControls && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleReconnect}
          disabled={isReconnecting}
          className="ml-2 h-7"
        >
          <RefreshCw className={cn("h-3 w-3 mr-1", isReconnecting && "animate-spin")} />
          {isReconnecting ? 'Connecting...' : 'Reconnect'}
        </Button>
      )}
    </div>
  );
};

export default WebSocketStatus;
