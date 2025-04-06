
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { InfoCircle, Brain, Zap, Circle, BarChartHorizontal, Activity } from 'lucide-react';

interface EpochExplainerProps {
  trigger?: React.ReactNode;
  compact?: boolean;
}

const EpochExplainer: React.FC<EpochExplainerProps> = ({ 
  trigger, 
  compact = false 
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant={compact ? "ghost" : "outline"} 
            size={compact ? "sm" : "default"} 
            className={compact ? "h-8 px-2" : ""}
          >
            <InfoCircle className={`${compact ? "h-4 w-4" : "h-5 w-5"} mr-1.5`} />
            {compact ? "Guide" : "What are Epochs & Ticks?"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-primary" />
            Neural Network Training Guide
          </DialogTitle>
          <DialogDescription>
            Understanding epochs, ticks, and neural network training in NNticks
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <section className="space-y-2">
            <h3 className="text-lg font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-500" />
              What are Ticks?
            </h3>
            <p className="text-sm text-muted-foreground">
              Ticks are individual price updates from the market. Each tick represents the current market price at a specific moment in time. The app collects these ticks in real-time via a WebSocket connection to trading servers.
            </p>
            <div className="bg-muted/30 p-3 rounded-md border mt-2">
              <p className="text-xs font-mono">Example: A tick might look like:</p>
              <pre className="text-xs overflow-x-auto p-2 bg-background/50 rounded mt-1">
                {JSON.stringify({ timestamp: "2025-04-06T01:25:32.104Z", value: 1234.56, market: "R_10" }, null, 2)}
              </pre>
            </div>
          </section>
          
          <section className="space-y-2">
            <h3 className="text-lg font-medium flex items-center">
              <BarChartHorizontal className="h-4 w-4 mr-2 text-green-500" />
              What are Epochs?
            </h3>
            <p className="text-sm text-muted-foreground">
              An epoch is a batch of ticks used for a single training cycle of the neural network. When enough ticks are collected (the batch size), they're processed as an epoch to train the model. Each completed epoch improves the neural network's ability to predict future price movements.
            </p>
            <div className="flex items-center justify-center my-4">
              <div className="flex items-center">
                <div className="flex flex-col items-center mr-6">
                  <div className="text-xs text-muted-foreground mb-1">Many Ticks</div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Circle key={i} className="h-3 w-3 text-blue-400" />
                    ))}
                  </div>
                </div>
                <Zap className="h-5 w-5 text-amber-500 mx-2" />
                <div className="flex flex-col items-center ml-6">
                  <div className="text-xs text-muted-foreground mb-1">One Epoch</div>
                  <div className="h-6 w-16 bg-green-500/20 border border-green-500 rounded-md flex items-center justify-center">
                    <span className="text-xs text-green-700 dark:text-green-300">Batch</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <section className="space-y-2">
            <h3 className="text-lg font-medium flex items-center">
              <Brain className="h-4 w-4 mr-2 text-purple-500" />
              How Training Works
            </h3>
            <p className="text-sm text-muted-foreground">
              The neural network training process follows these steps:
            </p>
            <ol className="text-sm space-y-3 mt-2">
              <li className="flex items-start">
                <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                <span>
                  <strong>Tick Collection:</strong> The app continuously collects price ticks from the market via WebSocket.
                </span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                <span>
                  <strong>Batch Formation:</strong> Ticks are accumulated until the batch size is reached (configurable, default 100).
                </span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                <span>
                  <strong>Epoch Processing:</strong> When a batch is complete, the neural network trains on this data.
                </span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
                <span>
                  <strong>Model Update:</strong> The neural network updates its weights and improves its prediction accuracy.
                </span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">5</span>
                <span>
                  <strong>Storage:</strong> Epoch results are saved to the database for later analysis and model continuity.
                </span>
              </li>
            </ol>
          </section>
          
          <section className="space-y-2">
            <h3 className="text-lg font-medium flex items-center">
              <InfoCircle className="h-4 w-4 mr-2 text-blue-500" />
              Tips for Effective Training
            </h3>
            <ul className="text-sm space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Let the system collect at least 10 epochs for initial training.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Keep the app open for continuous training - tick collection works in the background.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Smaller batch sizes (50-100) train more frequently but with less data.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Larger batch sizes (200-500) train less frequently but with more comprehensive data.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>The prediction accuracy increases as more epochs are completed.</span>
              </li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EpochExplainer;
