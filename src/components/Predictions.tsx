
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Brain, Clock, BadgeCheck, BadgeX, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { supabase } from '@/lib/supabase';

type PredictionType = 'rise' | 'fall' | 'even' | 'odd';

interface Prediction {
  id: number;
  type: PredictionType;
  confidence: number;
  timestamp: Date;
  outcome: "win" | "loss";
}

interface PendingPrediction {
  id: number;
  type: PredictionType;
  confidence: number;
  timestamp: Date;
  countdown: number;
}

// Visual representation of a neural network node
const NNNode = ({ id, active, x, y }: { id: string; active: boolean; x: number; y: number }) => (
  <div 
    id={id}
    className={`absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
      active ? 'bg-primary animate-pulse' : 'bg-muted-foreground'
    }`}
    style={{ left: `${x}%`, top: `${y}%` }}
  />
);

// Visual representation of a neural network connection
const NNConnection = ({ from, to, active }: { from: string; to: string; active: boolean }) => {
  const [path, setPath] = useState({ x1: 0, y1: 0, x2: 0, y2: 0 });
  
  useEffect(() => {
    const updatePath = () => {
      const fromNode = document.getElementById(from);
      const toNode = document.getElementById(to);
      
      if (!fromNode || !toNode) return;
      
      const fromRect = fromNode.getBoundingClientRect();
      const toRect = toNode.getBoundingClientRect();
      const parentRect = fromNode.parentElement?.getBoundingClientRect() || { left: 0, top: 0 };
      
      setPath({
        x1: fromRect.left - parentRect.left + fromRect.width / 2,
        y1: fromRect.top - parentRect.top + fromRect.height / 2,
        x2: toRect.left - parentRect.left + toRect.width / 2,
        y2: toRect.top - parentRect.top + toRect.height / 2,
      });
    };
    
    updatePath();
    window.addEventListener('resize', updatePath);
    
    return () => window.removeEventListener('resize', updatePath);
  }, [from, to]);
  
  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
      <line
        x1={path.x1}
        y1={path.y1}
        x2={path.x2}
        y2={path.y2}
        className={`transition-all duration-300 ${
          active ? 'stroke-primary stroke-[2px]' : 'stroke-muted-foreground stroke-[1px]'
        }`}
        strokeOpacity={active ? 1 : 0.3}
      />
    </svg>
  );
};

const NeuralNetworkVisual = () => {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  
  // Simulate neural network activity
  useEffect(() => {
    const interval = setInterval(() => {
      const layerIndex = Math.floor(Math.random() * 3);
      const nodeIndex = Math.floor(Math.random() * 5);
      setActiveNodeId(`node-${layerIndex}-${nodeIndex}`);
      
      setTimeout(() => setActiveNodeId(null), 500);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Generate nodes for 3 layers with 5 nodes each
  const layers = [0, 1, 2];
  const nodesPerLayer = 5;
  
  return (
    <div className="relative h-64 my-4">
      {layers.map(layerIdx => (
        <React.Fragment key={`layer-${layerIdx}`}>
          {[...Array(nodesPerLayer)].map((_, nodeIdx) => {
            const nodeId = `node-${layerIdx}-${nodeIdx}`;
            const x = 20 + layerIdx * 30;
            const y = 10 + (nodeIdx * (100 - 20)) / (nodesPerLayer - 1);
            
            return (
              <NNNode 
                key={nodeId}
                id={nodeId}
                active={activeNodeId === nodeId}
                x={x}
                y={y}
              />
            );
          })}
        </React.Fragment>
      ))}
      
      {/* Connections between layers */}
      {layers.slice(0, -1).map(layerIdx => (
        <React.Fragment key={`connections-${layerIdx}`}>
          {[...Array(nodesPerLayer)].map((_, fromNodeIdx) => (
            <React.Fragment key={`from-${layerIdx}-${fromNodeIdx}`}>
              {[...Array(nodesPerLayer)].map((_, toNodeIdx) => {
                const fromId = `node-${layerIdx}-${fromNodeIdx}`;
                const toId = `node-${layerIdx + 1}-${toNodeIdx}`;
                return (
                  <NNConnection 
                    key={`${fromId}-to-${toId}`}
                    from={fromId}
                    to={toId}
                    active={activeNodeId === fromId || activeNodeId === toId}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

const Predictions = () => {
  const [pendingPredictions, setPendingPredictions] = useState<PendingPrediction[]>([]);
  const [completedPredictions, setCompletedPredictions] = useState<Prediction[]>([]);
  const [predictionType, setPredictionType] = useState<PredictionType>('rise');
  const [predictionConfidence, setPredictionConfidence] = useState(50);
  const [isPredicting, setIsPredicting] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    // Load initial data or perform setup
    loadPredictions();
  }, []);
  
  const loadPredictions = async () => {
    // Load pending and completed predictions from Supabase
    // (replace with actual implementation)
  };
  
  let nextId = 0;
  
  const handleAddPrediction = async () => {
    if (isPredicting) return;
    
    setIsPredicting(true);
    
    const newPrediction: PendingPrediction = {
      id: nextId++,
      type: predictionType,
      confidence: predictionConfidence,
      timestamp: new Date(),
      countdown: 10
    };
    
    setPendingPredictions(prev => [...prev, newPrediction]);
    
    // Simulate countdown
    const countdownInterval = setInterval(() => {
      setPendingPredictions(prev => {
        const updatedPredictions = prev.map(p => {
          if (p.id === newPrediction.id) {
            return { ...p, countdown: p.countdown - 1 };
          }
          return p;
        });
        
        // Remove prediction when countdown reaches 0
        if (updatedPredictions.find(p => p.id === newPrediction.id)?.countdown === 0) {
          clearInterval(countdownInterval);
          handleCompletePrediction(newPrediction.id);
          return updatedPredictions.filter(p => p.id !== newPrediction.id);
        }
        
        return updatedPredictions;
      });
    }, 1000);
    
    setIsPredicting(false);
  };
  
  const handleCompletePrediction = (id: number) => {
    setPendingPredictions(prev => prev.filter(p => p.id !== id));
    
    // Determine random outcome for now (replace with actual implementation)
    const outcome: "win" | "loss" = Math.random() > 0.5 ? "win" : "loss";
    
    // Find the pending prediction before it's removed from state
    const pendingPred = pendingPredictions.find(p => p.id === id);
    
    setCompletedPredictions(prevCompleted => [
      ...prevCompleted,
      {
        id,
        type: pendingPred?.type || 'rise',
        confidence: pendingPred?.confidence || 0,
        timestamp: new Date(),
        outcome
      }
    ]);
    
    // Show notification
    toast.success(`Prediction completed: ${outcome.toUpperCase()}`);
  };
  
  const handleDeletePrediction = (id: number) => {
    setCompletedPredictions(prev => prev.filter(p => p.id !== id));
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="md:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Make Predictions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NeuralNetworkVisual />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Prediction Type
                </label>
                <select
                  value={predictionType}
                  onChange={(e) => setPredictionType(e.target.value as PredictionType)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="rise">Rise</option>
                  <option value="fall">Fall</option>
                  <option value="even">Even</option>
                  <option value="odd">Odd</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Confidence Level
                </label>
                <input
                  type="number"
                  value={predictionConfidence}
                  onChange={(e) => setPredictionConfidence(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>
            
            <Button onClick={handleAddPrediction} disabled={isPredicting}>
              {isPredicting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Predicting...
                </>
              ) : (
                'Add Prediction'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Pending Predictions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingPredictions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending predictions</p>
            ) : (
              pendingPredictions.map((prediction) => (
                <div key={prediction.id} className="flex items-center justify-between border rounded-md p-2">
                  <div>
                    <p className="text-sm font-medium">{prediction.type.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      {prediction.confidence}% confidence
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="mr-1 h-4 w-4" />
                    <span className="text-sm">{prediction.countdown}s</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Completed Predictions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completedPredictions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed predictions</p>
            ) : (
              completedPredictions.map((prediction) => (
                <div key={prediction.id} className="flex items-center justify-between border rounded-md p-2">
                  <div>
                    <p className="text-sm font-medium">{prediction.type.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      {prediction.confidence}% confidence
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {prediction.outcome === 'win' ? (
                      <BadgeCheck className="text-green-500 h-5 w-5" />
                    ) : (
                      <BadgeX className="text-red-500 h-5 w-5" />
                    )}
                    <Button variant="outline" size="icon" onClick={() => handleDeletePrediction(prediction.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Predictions;
