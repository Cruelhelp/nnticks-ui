
import React from 'react';
import { useEpochCollection } from '@/hooks/useEpochCollection';
import { Progress } from '@/components/ui/progress';
import { CircleCheck, Clock, Database, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EpochCollectionStatsProps {
  showControls?: boolean;
  className?: string;
}

const EpochCollectionStats: React.FC<EpochCollectionStatsProps> = ({ 
  showControls = true,
  className = '' 
}) => {
  const { 
    status, 
    batchSize, 
    epochsCompleted, 
    isActive,
    startCollection,
    stopCollection,
    resetCollection,
    isConnected
  } = useEpochCollection();
  
  // Calculate total ticks collected (completed epochs * batch size + current progress)
  const totalTicksCollected = (epochsComplected * batchSize) + status.currentCount;
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/30 p-3 rounded-md border flex flex-col">
          <span className="text-xs text-muted-foreground mb-1">Total Ticks</span>
          <div className="flex items-center">
            <Database className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
            <span className="text-xl font-semibold">{totalTicksCollected}</span>
          </div>
        </div>
        
        <div className="bg-muted/30 p-3 rounded-md border flex flex-col">
          <span className="text-xs text-muted-foreground mb-1">Epochs Completed</span>
          <div className="flex items-center">
            <CircleCheck className="h-3.5 w-3.5 mr-1.5 text-green-500" />
            <span className="text-xl font-semibold">{epochsCompleted}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
            <span className="text-sm">Current Epoch Progress</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
            {status.currentCount} / {batchSize}
          </span>
        </div>
        
        <Progress value={status.progress} className="h-2" />
        
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Collection {isActive ? 'active' : 'paused'}</span>
          <span>{Math.round(status.progress)}% complete</span>
        </div>
      </div>
      
      {showControls && (
        <div className="flex items-center justify-between space-x-2 pt-2">
          {isActive ? (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => stopCollection()}
            >
              Pause Collection
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              onClick={() => startCollection()}
              disabled={!isConnected}
            >
              Start Collection
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => resetCollection()}
            disabled={!isConnected || status.currentCount === 0}
          >
            Reset
          </Button>
        </div>
      )}
      
      <div className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center">
          <BarChart className="h-3.5 w-3.5 mr-1.5 text-primary" />
          <span className="text-sm">Training Statistics</span>
        </div>
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {epochsCompleted > 0 ? 'Model active' : 'Awaiting training'}
        </span>
      </div>
    </div>
  );
};

export default EpochCollectionStats;
