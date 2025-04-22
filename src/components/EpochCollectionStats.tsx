import React, { useState, useEffect } from 'react';
import { useEpochCollection } from '@/hooks/useEpochCollection';
import { Progress } from '@/components/ui/progress';
import { CircleCheck, Clock, Database, BarChart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const EpochCollectionStats: React.FC = () => {
  const { status, batchSize, isActive } = useEpochCollection();
  const [totalTicksCollected, setTotalTicksCollected] = useState<number>(0);
  const [epochsCompleted, setEpochsCompleted] = useState<number>(0);
  const { user } = useAuth();

  // Fetch tick and epoch counts from Supabase
  useEffect(() => {
    if (!user) return;
    // Fetch total ticks
    supabase
      .from('ticks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setTotalTicksCollected(count || 0));
    // Fetch epoch count
    supabase
      .from('epochs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setEpochsCompleted(count || 0));
  }, [user, status]);

  return (
    <div className="space-y-4">
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
        <Progress value={Math.min(100, Math.max(0, status.progress))} className="h-2" />
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Collection {isActive ? 'active' : 'paused'}</span>
          <span>{Math.round(status.progress)}% complete</span>
        </div>
      </div>
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
