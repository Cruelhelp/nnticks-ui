
import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WebSocketStatusProps {
  compact?: boolean;
  showTickInfo?: boolean;
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ 
  compact = false,
  showTickInfo = false
}) => {
  const { isConnected, connectionStatus, latestTick, tickCount } = useWebSocket();
  
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="relative">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="text-xs p-1">
              <p>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</p>
              <p>Status: {connectionStatus}</p>
              {showTickInfo && latestTick && (
                <>
                  <p className="mt-1">Latest Tick: {latestTick.value.toFixed(5)}</p>
                  <p>Total Ticks: {tickCount}</p>
                </>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-muted/30 rounded-md text-xs">
      <div className="relative">
        {isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </span>
      </div>
      <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      {showTickInfo && latestTick && (
        <span className="ml-2">
          Latest: {latestTick.value.toFixed(5)}
        </span>
      )}
    </div>
  );
};

export default WebSocketStatus;
