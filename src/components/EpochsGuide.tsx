
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, HelpCircle, BarChart3, LineChart, BrainCircuit, Server, Database, Clock, Cpu, Zap } from 'lucide-react';

interface EpochsGuideProps {
  trigger?: React.ReactNode;
  showButton?: boolean;
}

const EpochsGuide: React.FC<EpochsGuideProps> = ({ 
  trigger, 
  showButton = true 
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (showButton && (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Guide to Epochs & Ticks</span>
          </Button>
        ))}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BrainCircuit className="h-5 w-5 text-primary" />
            Neural Network Training Guide
          </DialogTitle>
          <DialogDescription>
            Understanding epochs, ticks, and neural network training in NN Ticks
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 my-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <LineChart className="h-5 w-5 text-primary" />
                  What are Ticks?
                </h3>
                <p className="text-sm leading-relaxed mb-3">
                  Ticks are individual price updates received in real-time from the market. Each tick represents a single 
                  price point at a specific moment in time.
                </p>
                <p className="text-sm leading-relaxed">
                  Our platform collects these ticks to analyze market patterns and train neural networks. They form the 
                  fundamental building blocks for market analysis and prediction.
                </p>
                
                <div className="mt-4 p-3 bg-muted/30 rounded-md">
                  <h4 className="text-sm font-medium mb-1">Key Characteristics:</h4>
                  <ul className="text-xs space-y-1 list-disc pl-4">
                    <li>Real-time price data points</li>
                    <li>Include timestamp and price value</li>
                    <li>Come directly from market data streams</li>
                    <li>High-frequency data (multiple ticks per second)</li>
                    <li>Used as inputs for neural network training</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                  What are Epochs?
                </h3>
                <p className="text-sm leading-relaxed mb-3">
                  An epoch is a complete batch of ticks used for a single training iteration of the neural network.
                  The default batch size is 100 ticks per epoch, but you can customize this in the settings.
                </p>
                <p className="text-sm leading-relaxed">
                  Each completed epoch improves the neural network's ability to recognize patterns and make predictions.
                  Epochs are saved in the database and used to track training progress.
                </p>
                
                <div className="mt-4 p-3 bg-muted/30 rounded-md">
                  <h4 className="text-sm font-medium mb-1">Key Characteristics:</h4>
                  <ul className="text-xs space-y-1 list-disc pl-4">
                    <li>Batches of ticks (default: 100 ticks)</li>
                    <li>Used for one complete training iteration</li>
                    <li>Saved in database for training history</li>
                    <li>Customizable batch size</li>
                    <li>Each epoch improves model accuracy</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <BrainCircuit className="h-5 w-5 text-primary" />
                How Neural Network Training Works
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4 mt-5">
                <div className="p-3 border rounded-md bg-muted/20">
                  <h4 className="font-medium text-sm flex items-center mb-2">
                    <Database className="h-4 w-4 mr-1.5 text-blue-500" />
                    Step 1: Data Collection
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    The system collects real-time ticks from market data. These ticks are the raw data that 
                    will be used to train the neural network. Each tick contains a timestamp and price value.
                  </p>
                </div>
                
                <div className="p-3 border rounded-md bg-muted/20">
                  <h4 className="font-medium text-sm flex items-center mb-2">
                    <BarChart3 className="h-4 w-4 mr-1.5 text-amber-500" />
                    Step 2: Epoch Formation
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Ticks are collected until we reach the batch size (default: 100 ticks). This batch forms a complete epoch.
                    An epoch represents one full training iteration for the neural network.
                  </p>
                </div>
                
                <div className="p-3 border rounded-md bg-muted/20">
                  <h4 className="font-medium text-sm flex items-center mb-2">
                    <Cpu className="h-4 w-4 mr-1.5 text-green-500" />
                    Step 3: Neural Network Training
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    When an epoch is complete, the neural network is trained using this batch of data.
                    The network processes the inputs, compares its predictions to actual outcomes, and
                    adjusts its weights to improve accuracy.
                  </p>
                </div>
                
                <div className="p-3 border rounded-md bg-muted/20">
                  <h4 className="font-medium text-sm flex items-center mb-2">
                    <Server className="h-4 w-4 mr-1.5 text-purple-500" />
                    Step 4: Persistence & Storage
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Training results and epoch data are saved to the database. This allows for restart-safe training
                    where the system can pick up where it left off after a browser refresh or app restart.
                  </p>
                </div>
                
                <div className="p-3 border rounded-md bg-muted/20">
                  <h4 className="font-medium text-sm flex items-center mb-2">
                    <Zap className="h-4 w-4 mr-1.5 text-yellow-500" />
                    Step 5: Continuous Improvement
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    As more epochs are completed, the neural network's accuracy improves. The system continuously
                    collects ticks, forms epochs, and trains the network, creating a feedback loop of improvement.
                  </p>
                </div>
                
                <div className="p-3 border rounded-md bg-muted/20">
                  <h4 className="font-medium text-sm flex items-center mb-2">
                    <LineChart className="h-4 w-4 mr-1.5 text-red-500" />
                    Step 6: Market Predictions
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    The trained neural network can now make predictions about future market movements.
                    These predictions become more accurate as the network processes more epochs and learns
                    more complex market patterns.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted/30 rounded-md">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <HelpCircle className="h-4 w-4 mr-1.5 text-primary" />
                  Practical Tips for Effective Training
                </h4>
                <ul className="text-xs space-y-2 list-disc pl-4">
                  <li>Collect at least 1,000 epochs for initial model accuracy</li>
                  <li>Train on different market volatilities to improve adaptability</li>
                  <li>Keep the epoch collection running while trading for continuous improvement</li>
                  <li>Use the Training tab to accelerate learning through focused training missions</li>
                  <li>Monitor training progress in the Epochs tab to see accuracy improvements over time</li>
                  <li>Customize the batch size based on your needs (larger batches = slower but more stable learning)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button className="w-full">
            <BookOpen className="h-4 w-4 mr-2" />
            Go to Advanced Documentation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EpochsGuide;
