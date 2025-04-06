
import React from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WebSocketStatusProps {
  compact?: boolean;
  showTickInfo?: boolean;
  className?: string;
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ 
  compact = false, 
  showTickInfo = false,
  className = '' 
}) => {
  const { isConnected, latestTick, ticks } = useWebSocket();
  
  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {isConnected ? (
          <Wifi className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-red-500" />
        )}
        
        {showTickInfo && latestTick && (
          <span className="text-xs text-muted-foreground">
            {latestTick.value.toFixed(5)}
          </span>
        )}
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isConnected ? "outline" : "destructive"} 
            className={`gap-1.5 h-7 ${className} ${isConnected ? 'border-green-500/30 bg-green-500/10 text-green-500' : ''}`}
          >
            {isConnected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            
            {isConnected ? 'Connected' : 'Disconnected'}
            
            {showTickInfo && isConnected && latestTick && (
              <span className="flex items-center gap-1 ml-1 border-l border-green-500/30 pl-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">{ticks.length} ticks</span>
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {isConnected 
            ? `WebSocket is connected. ${ticks.length} ticks received.`
            : 'WebSocket is disconnected. No data is being received.'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default WebSocketStatus;
