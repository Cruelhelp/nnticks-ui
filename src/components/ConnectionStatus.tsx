
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useWebSocketClient } from '@/hooks/useWebSocketClient';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
  compact?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  className,
  compact = false
}) => {
  const { hasRecentData, isConnected, connectionStatus } = useWebSocketClient();

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
      </Badge>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {hasRecentData ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-green-500 font-medium">ONLINE</span>
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
