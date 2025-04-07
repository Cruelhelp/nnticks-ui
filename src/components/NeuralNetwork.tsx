
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Brain, Activity } from 'lucide-react';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { useTicks } from '@/hooks/useTicks';
import { TrainingAnimation } from './TrainingAnimation';

const NeuralNetwork: React.FC = () => {
  const [trainingActive, setTrainingActive] = useState(false);
  const { ticks } = useTicks();
  const [networkStats, setNetworkStats] = useState({
    accuracy: 0,
    epochs: 0,
    loss: 0
  });

  useEffect(() => {
    if (trainingActive && ticks.length > 0) {
      const trainNetwork = async () => {
        const result = await neuralNetwork.train(ticks.map(t => t.value));
        setNetworkStats({
          accuracy: 100 - (result.loss * 100),
          epochs: networkStats.epochs + 1,
          loss: result.loss
        });
      };
      trainNetwork();
    }
  }, [ticks, trainingActive]);

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" /> Neural Network Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrainingAnimation active={trainingActive} stats={networkStats} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> Training Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium">Accuracy</div>
              <div className="text-2xl font-bold">{networkStats.accuracy.toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-sm font-medium">Loss</div>
              <div className="text-2xl font-bold">{networkStats.loss.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Epochs Completed</div>
              <div className="text-2xl font-bold">{networkStats.epochs}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NeuralNetwork;
