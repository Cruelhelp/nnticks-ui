
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertTriangle, Activity } from 'lucide-react';
import { wsManager } from '@/services/WebSocketManager';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
  compact?: boolean;
  showTickInfo?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  className,
  compact = false,
  showTickInfo = false
}) => {
  const [hasRecentData, setHasRecentData] = useState(wsManager.hasRecentData());
  const [isConnected, setIsConnected] = useState(wsManager.isConnected());
  const [connectionStatus, setConnectionStatus] = useState(wsManager.getStatus());
  const [tickCount, setTickCount] = useState(0);
  
  useEffect(() => {
    const updateStatus = () => {
      setHasRecentData(wsManager.hasRecentData());
      setIsConnected(wsManager.isConnected());
      setConnectionStatus(wsManager.getStatus());
    };
    
    const handleTick = () => {
      setTickCount(prev => prev + 1);
      updateStatus();
    };
    
    const handleStatusChange = () => {
      updateStatus();
    };
    
    // Initial update
    updateStatus();
    
    // Add event listeners
    wsManager.on('tick', handleTick);
    wsManager.on('statusChange', handleStatusChange);
    
    // Update status periodically
    const intervalId = setInterval(updateStatus, 1000);
    
    // Clean up
    return () => {
      wsManager.off('tick', handleTick);
      wsManager.off('statusChange', handleStatusChange);
      clearInterval(intervalId);
    };
  }, []);

  if (compact) {
    return (
      <Badge 
        variant={hasRecentData ? "success" : isConnected ? "outline" : "destructive"}
        className={cn("flex items-center gap-1", className)}
      >
        {hasRecentData && <Wifi className="h-3 w-3" />}
        {!hasRecentData && isConnected && <Wifi className="h-3 w-3 text-yellow-500" />}
        {!isConnected && <WifiOff className="h-3 w-3" />}
        {hasRecentData ? "ONLINE" : isConnected ? "CONNECTED" : "OFFLINE"}
        {showTickInfo && hasRecentData && <span className="ml-1 text-xs">({tickCount})</span>}
      </Badge>
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
    </div>
  );
};

export default ConnectionStatus;
