import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Activity, Settings, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useWebSocket } from '@/hooks/useWebSocket';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { useTicks } from '@/hooks/useTicks';

const Training = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [networkConfig, setNetworkConfig] = useState(neuralNetwork.getConfig());
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const { ticks } = useTicks();
  const ws = useWebSocket({
    subscription: { ticks: 'R_10' },
    onMessage: (data) => {
      if (data.tick) {
        // Handle new tick data
      }
    }
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTraining) {
      interval = setInterval(() => {
        const randomNodes = Array(5).fill(0).map(() => 
          `node-${Math.floor(Math.random() * 3)}-${Math.floor(Math.random() * 5)}`
        );
        setActiveNodes(randomNodes);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isTraining]);

  const handleTrain = async () => {
    if (!ticks.length) {
      toast.error('Not enough tick data for training');
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);

    try {
      await neuralNetwork.train(ticks.map(t => t.value), {
        maxEpochs: networkConfig.epochs,
        onProgress: (progress) => setTrainingProgress(progress * 100)
      });

      toast.success('Training completed successfully');
    } catch (error) {
      console.error('Training error:', error);
      toast.error('Training failed');
    } finally {
      setIsTraining(false);
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...networkConfig, [key]: value };
    setNetworkConfig(newConfig);
    neuralNetwork.updateConfig(newConfig);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Neural Network Training</h2>
          <p className="text-sm text-muted-foreground">Configure and train your neural network model</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Network Configuration</CardTitle>
            <CardDescription>Adjust your neural network parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Learning Rate</label>
              <Slider 
                value={[networkConfig.learningRate * 1000]}
                min={1}
                max={100}
                step={1}
                onValueChange={(value) => handleConfigChange('learningRate', value[0] / 1000)}
              />
              <span className="text-sm text-muted-foreground">{networkConfig.learningRate}</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Epochs</label>
              <Input 
                type="number"
                value={networkConfig.epochs}
                onChange={(e) => handleConfigChange('epochs', parseInt(e.target.value))}
                min={1}
                max={1000}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Activation Function</label>
              <Select 
                value={networkConfig.activationFunction}
                onValueChange={(value) => handleConfigChange('activationFunction', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relu">ReLU</SelectItem>
                  <SelectItem value="sigmoid">Sigmoid</SelectItem>
                  <SelectItem value="tanh">Tanh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training Status</CardTitle>
            <CardDescription>Current training progress and network state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTraining && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(trainingProgress)}%</span>
                </div>
                <Progress value={trainingProgress} />
              </div>
            )}

            <div className="p-4 border rounded-lg bg-muted/10">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline">
                  <Brain className="w-4 h-4 mr-1" />
                  Network Status
                </Badge>
                <Badge variant={ws.isConnected ? "success" : "destructive"}>
                  {ws.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Input Layer:</span>
                  <span>{networkConfig.layers[0]} neurons</span>
                </div>
                <div className="flex justify-between">
                  <span>Hidden Layer:</span>
                  <span>{networkConfig.layers[1]} neurons</span>
                </div>
                <div className="flex justify-between">
                  <span>Output Layer:</span>
                  <span>{networkConfig.layers[2]} neurons</span>
                </div>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleTrain}
              disabled={isTraining || !ws.isConnected}
            >
              {isTraining ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Start Training
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Training;