
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, Activity, Pause, Play, RotateCcw, Settings, Save } from 'lucide-react';
import { useEpochCollection } from '@/hooks/useEpochCollection';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EpochManagerProps {
  showControls?: boolean;
  showSettings?: boolean;
  className?: string;
  compact?: boolean;
}

const EpochManager: React.FC<EpochManagerProps> = ({
  showControls = true,
  showSettings = true,
  className = '',
  compact = false
}) => {
  const { user } = useAuth();
  const {
    status,
    batchSize,
    isInitialized,
    isActive,
    progress,
    epochsCompleted,
    startCollection,
    stopCollection,
    resetCollection,
    updateBatchSize
  } = useEpochCollection();
  
  const [batchSizeInput, setBatchSizeInput] = useState<string>(batchSize.toString());
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);
  
  useEffect(() => {
    if (isInitialized) {
      setBatchSizeInput(batchSize.toString());
    }
  }, [batchSize, isInitialized]);
  
  const handleStartStop = async () => {
    if (isActive) {
      stopCollection();
    } else {
      await startCollection();
    }
  };
  
  const handleReset = () => {
    resetCollection();
  };
  
  const handleBatchSizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newBatchSize = parseInt(batchSizeInput);
    
    if (isNaN(newBatchSize)) {
      toast.error('Please enter a valid number');
      return;
    }
    
    await updateBatchSize(newBatchSize);
  };
  
  const handleSaveModel = () => {
    try {
      const modelData = neuralNetwork.exportModel();
      const dataStr = JSON.stringify(modelData);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileName = `nnticks-model-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
      
      toast.success('Model saved successfully');
    } catch (error) {
      console.error('Error saving model:', error);
      toast.error('Failed to save model');
    }
  };
  
  if (compact) {
    return (
      <Card className={`${className} overflow-hidden`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Epoch Collection</span>
            </div>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
          
          <div className="mt-3 text-xs text-muted-foreground flex justify-between">
            <span>Epochs: {epochsCompleted}</span>
            <span>Batch: {batchSize}</span>
          </div>
          
          {showControls && (
            <div className="mt-3 flex justify-end gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={handleStartStop}
                    >
                      {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isActive ? 'Pause' : 'Start'} epoch collection</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Neural Network Epoch Collection
        </CardTitle>
        <CardDescription>
          Collecting and processing market data for neural network training
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Current Epoch Progress</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'
              }`}>
                {isActive ? 'Active' : 'Paused'}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Ticks collected</span>
                <span>{status.currentCount} / {batchSize}</span>
              </div>
              <Progress value={progress} className="h-2" />
              
              {status.isProcessing && (
                <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 animate-pulse">
                  Processing epoch data...
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Epochs Completed</Label>
              <div className="text-2xl font-semibold">{epochsCompleted}</div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Batch Size</Label>
              <div className="text-2xl font-semibold">{batchSize}</div>
            </div>
          </div>
          
          {showSettings && showSettingsPanel && (
            <div className="space-y-4 p-3 border rounded-md bg-muted/20">
              <form onSubmit={handleBatchSizeSubmit} className="flex flex-col gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="batchSize" className="text-xs">Epoch Batch Size</Label>
                  <div className="flex gap-2">
                    <Input
                      id="batchSize"
                      type="number"
                      min="10"
                      max="1000"
                      value={batchSizeInput}
                      onChange={(e) => setBatchSizeInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" size="sm">Update</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of ticks to collect before training (10-1000)
                  </p>
                </div>
              </form>
              
              <div className="pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSaveModel}
                  className="w-full"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Save Neural Network Model
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {showControls && (
        <CardFooter className="flex justify-between pt-2 border-t">
          <div>
            {showSettings && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              >
                <Settings className="h-4 w-4 mr-1.5" />
                {showSettingsPanel ? 'Hide Settings' : 'Settings'}
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              disabled={!user}
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Reset
            </Button>
            
            <Button 
              variant={isActive ? 'secondary' : 'default'} 
              size="sm" 
              onClick={handleStartStop}
              disabled={!user}
            >
              {isActive ? (
                <>
                  <Pause className="h-4 w-4 mr-1.5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1.5" />
                  Start
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default EpochManager;
