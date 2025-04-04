
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Brain, Clock, BadgeCheck, BadgeX, X, TrendingUp, TrendingDown, Zap, AlertCircle, Copyright, Settings, Gauge } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { supabase } from '@/lib/supabase';
import { useWebSocket } from '@/hooks/useWebSocket';
import { PREDICTION_MODES, PredictionMode, PredictionPhase, PredictionType } from '@/types/chartTypes';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface Prediction {
  id: number;
  confidence: number;
  timestamp: Date;
  outcome: "win" | "loss" | "pending";
  market: string;
  startPrice?: number;
  endPrice?: number;
  timePeriod: number;
  predictionType: PredictionType;
}

interface PendingPrediction {
  id: number;
  confidence: number;
  timestamp: Date;
  warningCountdown: number; // 10-second warning countdown
  tickCountdown: number;    // Tick-based countdown
  phase: PredictionPhase;   // Current phase of the prediction
  market: string;
  startPrice: number;
  tickPeriod: number;       // Number of ticks to wait
  ticksElapsed: number;     // Number of ticks elapsed during counting phase
  predictionType: PredictionType;
}

// Visual representation of a neural network node
const NNNode = ({ id, active, x, y, intensity = 1 }: { id: string; active: boolean; x: number; y: number; intensity?: number }) => (
  <div 
    id={id}
    className={`absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
      active ? 'bg-primary animate-pulse shadow-lg shadow-primary/50' : 'bg-muted-foreground'
    }`}
    style={{ 
      left: `${x}%`, 
      top: `${y}%`,
      opacity: active ? 0.7 + (intensity * 0.3) : 0.5 
    }}
  />
);

// Visual representation of a neural network connection
const NNConnection = ({ from, to, active, intensity = 1 }: { from: string; to: string; active: boolean; intensity?: number }) => {
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
        strokeOpacity={active ? 0.7 + (intensity * 0.3) : 0.3}
        strokeDasharray={active && intensity > 1.5 ? "4,2" : ""}
      />
    </svg>
  );
};

const NeuralNetworkVisual = ({ 
  isTraining = false, 
  isBotRunning = false, 
  hasError = false 
}) => {
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const [sparkleNodes, setSparkleNodes] = useState<{id: string, intensity: number}[]>([]);
  
  // Simulate neural network activity with more animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (hasError) {
      // Error visualization - red flashing nodes
      interval = setInterval(() => {
        const errorNode = `node-${Math.floor(Math.random() * 3)}-${Math.floor(Math.random() * 5)}`;
        setActiveNodes([errorNode]);
        setPulseIntensity(2);
        
        // Clear nodes after a short delay
        setTimeout(() => setActiveNodes([]), 200);
      }, 500);
    } else if (isTraining) {
      // Training visualization - multiple nodes with high intensity
      interval = setInterval(() => {
        const numberOfActiveNodes = Math.floor(Math.random() * 5) + 5; // 5-10 nodes
        const newActiveNodes = [];
        
        for (let i = 0; i < numberOfActiveNodes; i++) {
          const layerIndex = Math.floor(Math.random() * 3);
          const nodeIndex = Math.floor(Math.random() * 5);
          newActiveNodes.push(`node-${layerIndex}-${nodeIndex}`);
        }
        
        setActiveNodes(newActiveNodes);
        setPulseIntensity(Math.random() * 2 + 1); // Varied pulse intensity during training
        
        // Generate sparkles for training
        const newSparkles = Array(3).fill(0).map(() => ({
          id: `node-${Math.floor(Math.random() * 3)}-${Math.floor(Math.random() * 5)}`,
          intensity: Math.random() + 1
        }));
        setSparkleNodes(newSparkles);
        
        // Clear nodes after a delay
        setTimeout(() => {
          setActiveNodes([]);
          setSparkleNodes([]);
        }, 200);
      }, 300);
    } else if (isBotRunning) {
      // Bot running visualization - coordinated pulses
      interval = setInterval(() => {
        // Generate a wave-like pattern
        const phase = Math.floor(Date.now() / 500) % 3;
        const newActiveNodes = [];
        
        // Activate nodes in the current phase/layer
        for (let nodeIndex = 0; nodeIndex < 5; nodeIndex++) {
          if (Math.random() > 0.5) {
            newActiveNodes.push(`node-${phase}-${nodeIndex}`);
          }
        }
        
        setActiveNodes(newActiveNodes);
        setPulseIntensity(1.5);
        
        // Occasional sparkles for active bot
        if (Math.random() > 0.7) {
          setSparkleNodes([{
            id: `node-${Math.floor(Math.random() * 3)}-${Math.floor(Math.random() * 5)}`,
            intensity: 2
          }]);
        } else {
          setSparkleNodes([]);
        }
        
        // Clear nodes after a delay
        setTimeout(() => {
          setActiveNodes([]);
        }, 300);
      }, 600);
    } else {
      // Standard mode - just activate one node at a time
      interval = setInterval(() => {
        const layerIndex = Math.floor(Math.random() * 3);
        const nodeIndex = Math.floor(Math.random() * 5);
        setActiveNodes([`node-${layerIndex}-${nodeIndex}`]);
        setPulseIntensity(1);
        setSparkleNodes([]);
        
        // Clear nodes after a delay
        setTimeout(() => setActiveNodes([]), 800);
      }, 1200);
    }
    
    return () => clearInterval(interval);
  }, [isTraining, isBotRunning, hasError]);
  
  // Generate nodes for 3 layers with 5 nodes each
  const layers = [0, 1, 2];
  const nodesPerLayer = 5;
  
  return (
    <div className="relative h-64 my-4">
      {/* Special visualization overlays */}
      {isTraining && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent animate-pulse z-0"></div>
      )}
      
      {isBotRunning && (
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent z-0" style={{animation: 'pulse 4s infinite'}}></div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 bg-red-500/5 z-0" style={{animation: 'pulse 0.5s infinite'}}></div>
      )}
      
      {layers.map(layerIdx => (
        React.createElement(React.Fragment, { key: `layer-${layerIdx}` },
          [...Array(nodesPerLayer)].map((_, nodeIdx) => {
            const nodeId = `node-${layerIdx}-${nodeIdx}`;
            const x = 20 + layerIdx * 30;
            const y = 10 + (nodeIdx * (100 - 20)) / (nodesPerLayer - 1);
            const isActive = activeNodes.includes(nodeId);
            const sparkleNode = sparkleNodes.find(n => n.id === nodeId);
            const intensity = sparkleNode ? sparkleNode.intensity : 1;
            
            return (
              <NNNode 
                key={nodeId}
                id={nodeId}
                active={isActive || !!sparkleNode}
                x={x}
                y={y}
                intensity={intensity}
              />
            );
          })
        )
      ))}
      
      {/* Connections between layers */}
      {layers.slice(0, -1).map(layerIdx => (
        React.createElement(React.Fragment, { key: `connections-${layerIdx}` },
          [...Array(nodesPerLayer)].map((_, fromNodeIdx) => (
            React.createElement(React.Fragment, { key: `from-${layerIdx}-${fromNodeIdx}` },
              [...Array(nodesPerLayer)].map((_, toNodeIdx) => {
                const fromId = `node-${layerIdx}-${fromNodeIdx}`;
                const toId = `node-${layerIdx + 1}-${toNodeIdx}`;
                const isActive = activeNodes.includes(fromId) || activeNodes.includes(toId);
                const sparkleFrom = sparkleNodes.find(n => n.id === fromId);
                const sparkleTo = sparkleNodes.find(n => n.id === toId);
                const intensity = sparkleFrom || sparkleTo ? 2 : 1;
                
                return (
                  <NNConnection 
                    key={`${fromId}-to-${toId}`}
                    from={fromId}
                    to={toId}
                    active={isActive || !!sparkleFrom || !!sparkleTo}
                    intensity={intensity}
                  />
                );
              })
            )
          ))
        )
      ))}
      
      {/* Dynamic visualization elements */}
      {(isTraining || isBotRunning) && (
        <>
          <div 
            className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-primary/10 to-transparent"
            style={{
              animation: `pulse ${isTraining ? 2 : 4}s infinite alternate`,
              opacity: 0.5 + (pulseIntensity * 0.2)
            }}
          ></div>
          
          <div className="absolute top-2 right-2 px-2 py-1 bg-primary/20 text-xs rounded-md animate-pulse">
            {isTraining ? 'Training in progress...' : isBotRunning ? 'AI predictions active' : ''}
          </div>
        </>
      )}
      
      {/* Error state indication */}
      {hasError && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/20 text-xs text-red-500 rounded-md animate-pulse">
          Neural network error
        </div>
      )}
    </div>
  );
};

const Predictions = () => {
  const [pendingPredictions, setPendingPredictions] = useState<PendingPrediction[]>([]);
  const [completedPredictions, setCompletedPredictions] = useState<Prediction[]>([]);
  const [predictionTimePeriod, setPredictionTimePeriod] = useState(3);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [currentMarket, setCurrentMarket] = useState('R_10');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [predictionMode, setPredictionMode] = useState<PredictionMode>('balanced');
  const { user } = useAuth();
  
  const autoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tickCounterRef = useRef<Map<number, number>>(new Map());
  const lastPredictionTimeRef = useRef<number>(0);
  const predictionRateRef = useRef<number>(15000); // Default 15 seconds between predictions
  
  // Connect to broker WebSocket for tick data
  const ws = useWebSocket({
    wsUrl: 'wss://ws.binaryws.com/websockets/v3?app_id=1089',
    subscription: { ticks: 'R_10' },
    onMessage: (data) => {
      if (data.tick) {
        setCurrentPrice(data.tick.quote);
        setCurrentMarket(data.tick.symbol);
        
        // Process tick for pending predictions
        handleNewTick(data.tick.quote);
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setHasError(true);
      setTimeout(() => setHasError(false), 5000);
    },
    onOpen: () => {
      console.log('WebSocket connected for predictions');
      setHasError(false);
    },
    onClose: () => {
      console.log('WebSocket closed for predictions');
    },
    autoReconnect: true,
  });
  
  useEffect(() => {
    // Load initial data from Supabase
    loadPredictions();
    
    return () => {
      // Cleanup
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    // Adjust prediction rate based on selected mode
    if (isBotRunning) {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
      }
      
      // Set prediction rate based on mode
      switch (predictionMode) {
        case 'fast':
          predictionRateRef.current = 8000; // 8 seconds
          break;
        case 'strict':
          predictionRateRef.current = 30000; // 30 seconds
          break;
        default:
          predictionRateRef.current = 15000; // 15 seconds (balanced)
      }
      
      // Restart the bot with new settings
      autoIntervalRef.current = setInterval(generatePrediction, predictionRateRef.current);
      
      // Generate one immediately if it's been long enough since the last prediction
      const timeSinceLastPrediction = Date.now() - lastPredictionTimeRef.current;
      if (timeSinceLastPrediction > 5000) {
        setTimeout(generatePrediction, 1000);
      }
    }
  }, [predictionMode, isBotRunning]);
  
  const loadPredictions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('trade_history')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(10);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const loaded = data.map(item => ({
          id: item.id,
          confidence: item.confidence,
          timestamp: new Date(item.timestamp),
          outcome: item.outcome as "win" | "loss" | "pending",
          market: item.market,
          startPrice: item.start_price,
          endPrice: item.end_price,
          timePeriod: item.time_period || 3,
          predictionType: item.prediction as PredictionType
        }));
        setCompletedPredictions(loaded);
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
      toast.error('Failed to load prediction history');
    }
  };
  
  // Generate prediction ID
  const generateId = () => {
    return Date.now() + Math.floor(Math.random() * 1000);
  };
  
  // Handle a new tick from the WebSocket
  const handleNewTick = (price: number) => {
    // Process pending predictions
    setPendingPredictions(prevPredictions => {
      const updatedPredictions = prevPredictions.map(prediction => {
        // Skip predictions that are not in the counting phase
        if (prediction.phase !== 'counting') {
          return prediction;
        }
        
        // Increment tick counter for this prediction
        const currentTicks = tickCounterRef.current.get(prediction.id) || 0;
        const newTicksCount = currentTicks + 1;
        tickCounterRef.current.set(prediction.id, newTicksCount);
        
        // Check if we've reached the target number of ticks
        if (newTicksCount >= prediction.tickPeriod) {
          // Mark as completed and schedule evaluation
          setTimeout(() => {
            handleCompletePrediction(prediction.id, price);
            // Remove this prediction's tick counter
            tickCounterRef.current.delete(prediction.id);
          }, 100);
          
          return {
            ...prediction,
            phase: 'completed' as PredictionPhase,
            ticksElapsed: prediction.tickPeriod
          };
        }
        
        // Update tick count
        return {
          ...prediction,
          ticksElapsed: newTicksCount
        };
      });
      
      return updatedPredictions;
    });
  };
  
  // Neural network-generated prediction
  const generatePrediction = useCallback(() => {
    if (!currentPrice || !isBotRunning) return null;
    
    // Update last prediction time
    lastPredictionTimeRef.current = Date.now();
    
    // Get last 20 ticks from WebSocket history
    const tickValues = ws.ticks.map(t => t.value);
    
    if (tickValues.length < 10) {
      return null; // Not enough data yet
    }
    
    // Generate a prediction using the neural network
    return neuralNetwork.predict(tickValues, 'rise', predictionTimePeriod as any, currentPrice)
      .then(prediction => {
        // Check if confidence meets the threshold for the selected mode
        const minConfidence = PREDICTION_MODES[predictionMode].minConfidence;
        
        if (prediction.confidence >= minConfidence) {
          handleAddPrediction(
            prediction.type, 
            prediction.period, 
            Math.round(prediction.confidence * 100),
            true
          );
        } else {
          console.log(`Prediction skipped: confidence ${prediction.confidence.toFixed(2)} below threshold ${minConfidence.toFixed(2)}`);
        }
      })
      .catch(err => {
        console.error("Error generating prediction:", err);
        setHasError(true);
        setTimeout(() => setHasError(false), 5000);
      });
  }, [currentPrice, ws.ticks, isBotRunning, predictionTimePeriod, predictionMode]);
  
  // Toggle bot
  const toggleBot = () => {
    if (isBotRunning) {
      setIsBotRunning(false);
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
      toast.info('Bot stopped');
    } else {
      // Start with a training sequence
      setIsTraining(true);
      setTrainingProgress(0);
      
      const trainingInterval = setInterval(() => {
        setTrainingProgress(prev => {
          if (prev >= 100) {
            clearInterval(trainingInterval);
            setIsTraining(false);
            
            // Start the bot
            setIsBotRunning(true);
            toast.success(`Bot started - ${PREDICTION_MODES[predictionMode].mode} mode activated`);
            
            // Generate a prediction on an interval based on mode
            autoIntervalRef.current = setInterval(generatePrediction, predictionRateRef.current);
            // Generate one immediately
            setTimeout(generatePrediction, 1000);
            
            return 100;
          }
          return prev + Math.floor(Math.random() * 5) + 2; // Random progress increment
        });
      }, 300);
    }
  };
  
  const handleAddPrediction = async (
    type: PredictionType = 'rise',
    period: number = predictionTimePeriod, 
    confidence: number = 75,
    isAuto: boolean = false
  ) => {
    if (isPredicting) return;
    
    if (!currentPrice) {
      toast.error('No price data available');
      return;
    }
    
    setIsPredicting(true);
    
    // Create new prediction with initial warning phase
    const newPrediction: PendingPrediction = {
      id: generateId(),
      confidence,
      timestamp: new Date(),
      warningCountdown: 10, // 10-second warning countdown
      tickCountdown: 0,
      phase: 'warning' as PredictionPhase,
      market: currentMarket,
      startPrice: currentPrice,
      tickPeriod: period,
      ticksElapsed: 0,
      predictionType: type
    };
    
    setPendingPredictions(prev => [...prev, newPrediction]);
    
    if (isAuto) {
      toast(`New prediction: Market will ${type} after 10s + ${period} ticks`, {
        icon: <Zap className="h-4 w-4" />,
        description: `${confidence}% confidence - Place your trade now!`
      });
    } else {
      toast.success(`Prediction added: Market will ${type} after 10s + ${period} ticks`);
    }
    
    // Start the warning countdown (10 seconds)
    const warningCountdownInterval = setInterval(() => {
      setPendingPredictions(prev => {
        const updatedPredictions = prev.map(p => {
          if (p.id === newPrediction.id) {
            const newCountdown = p.warningCountdown - 1;
            
            // If warning countdown reaches 0, transition to counting phase
            if (newCountdown <= 0) {
              clearInterval(warningCountdownInterval);
              
              // Initialize tick counter for this prediction
              tickCounterRef.current.set(p.id, 0);
              
              // Record the starting price at this moment
              const startPriceAtCounting = currentPrice;
              
              // Notify about transition to tick counting
              toast(`Starting tick count for ${period} ticks`, {
                description: `Initial price: ${startPriceAtCounting?.toFixed(5)}`
              });
              
              return {
                ...p,
                warningCountdown: 0,
                phase: 'counting' as PredictionPhase,
                startPrice: startPriceAtCounting,  // Update start price at counting phase
                ticksElapsed: 0
              };
            }
            
            return { ...p, warningCountdown: newCountdown };
          }
          return p;
        });
        
        return updatedPredictions;
      });
    }, 1000);
    
    setIsPredicting(false);
  };
  
  const handleCompletePrediction = async (id: number, finalPrice: number) => {
    // Find the prediction
    const pendingPred = pendingPredictions.find(p => p.id === id);
    
    if (!pendingPred) return;
    
    // Check the result based on prediction type
    const startPrice = pendingPred.startPrice;
    const endPrice = finalPrice;
    let outcome: "win" | "loss" = "loss";
    
    switch (pendingPred.predictionType) {
      case 'rise':
        outcome = endPrice > startPrice ? "win" : "loss";
        break;
      case 'fall':
        outcome = endPrice < startPrice ? "win" : "loss";
        break;
      case 'even':
        outcome = Math.round(endPrice * 100) % 2 === 0 ? "win" : "loss";
        break;
      case 'odd':
        outcome = Math.round(endPrice * 100) % 2 !== 0 ? "win" : "loss";
        break;
    }
    
    // Remove from pending predictions
    setPendingPredictions(prev => prev.filter(p => p.id !== id));
    
    // Add to completed predictions
    const completedPrediction: Prediction = {
      id,
      confidence: pendingPred.confidence,
      timestamp: pendingPred.timestamp,
      outcome,
      market: pendingPred.market,
      startPrice: pendingPred.startPrice,
      endPrice,
      timePeriod: pendingPred.tickPeriod,
      predictionType: pendingPred.predictionType
    };
    
    setCompletedPredictions(prevCompleted => [completedPrediction, ...prevCompleted]);
    
    // Show notification with price details
    if (outcome === 'win') {
      toast.success(`Prediction correct! Market ${pendingPred.predictionType === 'rise' ? 'rose' : 'fell'} from ${startPrice.toFixed(5)} to ${endPrice.toFixed(5)}`);
    } else {
      toast.error(`Prediction incorrect. Market ${pendingPred.predictionType === 'rise' ? 'fell' : 'rose'} from ${startPrice.toFixed(5)} to ${endPrice.toFixed(5)}`);
    }
    
    // Save to Supabase
    if (user) {
      try {
        const { error } = await supabase.from('trade_history').insert({
          user_id: user.id,
          timestamp: new Date().toISOString(),
          market: pendingPred.market,
          prediction: pendingPred.predictionType,
          confidence: pendingPred.confidence,
          outcome: outcome,
          start_price: startPrice,
          end_price: endPrice,
          time_period: pendingPred.tickPeriod
        });
        
        if (error) {
          console.error('Error saving prediction:', error);
        }
      } catch (error) {
        console.error('Failed to save prediction:', error);
      }
    }
  };
  
  const handleDeletePrediction = (id: number) => {
    setCompletedPredictions(prev => prev.filter(p => p.id !== id));
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="md:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Neural Network Predictions</span>
              <div className="flex items-center gap-2">
                <Badge variant={isBotRunning ? "default" : "outline"} 
                  className={isBotRunning ? "animate-pulse" : ""}
                >
                  {isBotRunning ? 'Bot: Running' : 'Bot: Idle'}
                </Badge>
                {currentPrice && (
                  <Badge variant="secondary">
                    {currentMarket}: {currentPrice.toFixed(5)}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <NeuralNetworkVisual 
                isTraining={isTraining} 
                isBotRunning={isBotRunning}
                hasError={hasError}
              />
              
              {/* Waiting for data message */}
              {!currentPrice && (
                <div className="absolute top-0 right-0 text-muted-foreground bg-background/80 p-2 rounded-md">
                  Waiting for market data...
                </div>
              )}
              
              {currentPrice && !isTraining && (
                <div className="absolute top-1/4 right-8 text-lg font-semibold">
                  {!hasError && (
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-muted-foreground">
                        {isBotRunning ? 'AI is analyzing the market...' : 'Neural network ready'}
                      </span>
                      {isBotRunning && (
                        <div className="flex items-center gap-1 mt-1">
                          <Gauge className="h-5 w-5 text-primary" />
                          <span className="text-primary">{PREDICTION_MODES[predictionMode].mode} mode</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {isTraining && (
                <div className="absolute top-1/4 right-8">
                  <div className="flex flex-col items-end">
                    <div className="px-3 py-2 bg-primary/10 animate-pulse rounded-md border border-primary/20">
                      <div className="text-sm font-medium">Training Model</div>
                      <Progress value={trainingProgress} className="h-1 w-32 mt-1" />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Epoch {Math.floor(trainingProgress / 4)}</span>
                        <span>{trainingProgress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">
                  Time Period (ticks)
                </label>
                <select
                  value={predictionTimePeriod}
                  onChange={(e) => setPredictionTimePeriod(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  disabled={isBotRunning}
                >
                  <option value="1">1 tick</option>
                  <option value="3">3 ticks</option>
                  <option value="5">5 ticks</option>
                  <option value="10">10 ticks</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">
                  Prediction Mode
                </label>
                <RadioGroup 
                  value={predictionMode}
                  onValueChange={(value) => setPredictionMode(value as PredictionMode)}
                  className="flex flex-col space-y-1"
                  disabled={isBotRunning}
                >
                  {Object.entries(PREDICTION_MODES).map(([key, config]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem value={key} id={`mode-${key}`} />
                      <Label htmlFor={`mode-${key}`} className="text-sm cursor-pointer">
                        {config.mode} ({(config.minConfidence * 100).toFixed(0)}%+)
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
            
            <Button onClick={toggleBot} 
              className={`w-full relative overflow-hidden group ${isBotRunning ? 'bg-red-600 hover:bg-red-700' : ''}`}
              variant={isBotRunning ? "destructive" : "default"}
            >
              {isTraining ? (
                <>
                  <Brain className="mr-2 h-4 w-4 animate-pulse" />
                  Training Neural Network...
                </>
              ) : isBotRunning ? (
                <>
                  <span className="relative z-10">Stop Bot</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">Start Bot</span>
                  <span className="absolute inset-0 bg-primary/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                </>
              )}
            </Button>
            
            <div className="text-xs text-muted-foreground">
              The Neural Network automatically analyzes market patterns and makes predictions based on detected opportunities. Select a mode that fits your trading style.
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground pt-2 border-t">
            <Copyright className="h-3 w-3 mr-1" /> NNticks Enterprise Analytics 2025 - Neural Predictions
          </CardFooter>
        </Card>
      </div>
      
      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Predictions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
            {pendingPredictions.length === 0 ? (
              <div className="text-sm text-muted-foreground flex flex-col items-center justify-center h-24 text-center">
                <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                <p>No pending predictions</p>
                <p className="text-xs mt-1">Start the bot to begin making predictions</p>
              </div>
            ) : (
              <div className="space-y-2 animate-[enter_0.3s_ease-out]">
                {pendingPredictions.map((prediction) => (
                  <div key={prediction.id} className="flex items-center justify-between border rounded-md p-3 hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <p className="font-medium">AI Prediction: {prediction.predictionType.toUpperCase()}</p>
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                        <span>{prediction.market}</span>
                        <span>•</span>
                        <span>{prediction.confidence}% confidence</span>
                      </div>
                      <div className="text-xs mt-1">
                        Start: {prediction.startPrice.toFixed(5)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-1">
                        {prediction.phase === 'warning' ? (
                          <>
                            <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
                            <span className="text-sm font-mono text-yellow-500">{prediction.warningCountdown}s</span>
                            <span className="text-xs text-muted-foreground">(warning)</span>
                          </>
                        ) : prediction.phase === 'counting' ? (
                          <>
                            <Clock className="h-4 w-4 text-primary animate-pulse" />
                            <span className="text-sm font-mono">{prediction.ticksElapsed}/{prediction.tickPeriod} ticks</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-mono text-green-500">Evaluating...</span>
                          </>
                        )}
                      </div>
                      
                      {prediction.phase === 'warning' ? (
                        <Progress value={(10 - prediction.warningCountdown) * 10} className="w-16 h-1" />
                      ) : (
                        <Progress value={(prediction.ticksElapsed / prediction.tickPeriod) * 100} className="w-16 h-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground pt-2 border-t">
            <Copyright className="h-3 w-3 mr-1" /> NNticks Analytics
          </CardFooter>
        </Card>
      </div>
      
      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5" />
              Completed Predictions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
            {completedPredictions.length === 0 ? (
              <div className="text-sm text-muted-foreground flex flex-col items-center justify-center h-24 text-center">
                <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                <p>No completed predictions</p>
                <p className="text-xs mt-1">Your prediction history will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedPredictions.map((prediction) => (
                  <div key={prediction.id} 
                    className={`flex items-start justify-between border rounded-md p-3 hover:bg-muted/50 transition-colors ${
                      prediction.outcome === 'win' ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <p className="font-medium">
                          {prediction.predictionType.toUpperCase()}
                        </p>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        {prediction.market} • {prediction.confidence}% confidence
                      </div>
                      
                      {prediction.startPrice && prediction.endPrice && (
                        <div className="mt-2 text-xs space-y-1">
                          <div>Start: {prediction.startPrice.toFixed(5)}</div>
                          <div>End: {prediction.endPrice.toFixed(5)}</div>
                          <div>Change: {(prediction.endPrice - prediction.startPrice).toFixed(5)}
                            <span className={prediction.endPrice > prediction.startPrice ? 'text-green-500' : 'text-red-500'}>
                              {" "}({prediction.endPrice > prediction.startPrice ? '↑' : '↓'})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        {prediction.outcome === 'win' ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                            WIN
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                            <BadgeX className="mr-1 h-3.5 w-3.5" />
                            LOSS
                          </Badge>
                        )}
                      </div>
                      
                      <Button variant="ghost" size="icon" onClick={() => handleDeletePrediction(prediction.id)} className="h-7 w-7">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground pt-2 border-t">
            <Copyright className="h-3 w-3 mr-1" /> NNticks Enterprise Analytics
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Predictions;
