
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Brain, Clock, BadgeCheck, BadgeX, X, TrendingUp, TrendingDown, Zap, AlertCircle, Copyright } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { supabase } from '@/lib/supabase';
import { useWebSocket } from '@/hooks/useWebSocket';

// Prediction phase types
type PredictionPhase = 'warning' | 'counting' | 'completed';

interface Prediction {
  id: number;
  confidence: number;
  timestamp: Date;
  outcome: "win" | "loss" | "pending";
  market: string;
  startPrice?: number;
  endPrice?: number;
  timePeriod: number;
  predictionType: 'rise' | 'fall' | 'even' | 'odd';
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
  predictionType: 'rise' | 'fall' | 'even' | 'odd';
}

// Visual representation of a neural network node
const NNNode = ({ id, active, x, y }: { id: string; active: boolean; x: number; y: number }) => (
  <div 
    id={id}
    className={`absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
      active ? 'bg-primary animate-pulse shadow-lg shadow-primary/50' : 'bg-muted-foreground'
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

const NeuralNetworkVisual = ({ isTraining = false }) => {
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  
  // Simulate neural network activity with more animation
  useEffect(() => {
    const interval = setInterval(() => {
      // If in training mode, activate multiple nodes simultaneously
      if (isTraining) {
        const numberOfActiveNodes = Math.floor(Math.random() * 5) + 3; // 3-7 nodes
        const newActiveNodes = [];
        
        for (let i = 0; i < numberOfActiveNodes; i++) {
          const layerIndex = Math.floor(Math.random() * 3);
          const nodeIndex = Math.floor(Math.random() * 5);
          newActiveNodes.push(`node-${layerIndex}-${nodeIndex}`);
        }
        
        setActiveNodes(newActiveNodes);
        setPulseIntensity(Math.random() * 2 + 1); // Varied pulse intensity during training
      } else {
        // Standard mode - just activate one node at a time
        const layerIndex = Math.floor(Math.random() * 3);
        const nodeIndex = Math.floor(Math.random() * 5);
        setActiveNodes([`node-${layerIndex}-${nodeIndex}`]);
        setPulseIntensity(1);
      }
      
      // Clear nodes after a delay
      setTimeout(() => setActiveNodes([]), isTraining ? 400 : 800);
    }, isTraining ? 600 : 1200);
    
    return () => clearInterval(interval);
  }, [isTraining]);
  
  // Generate nodes for 3 layers with 5 nodes each
  const layers = [0, 1, 2];
  const nodesPerLayer = 5;
  
  return (
    <div className="relative h-64 my-4">
      {/* Special training visualization overlay */}
      {isTraining && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent animate-pulse z-0"></div>
      )}
      
      {layers.map(layerIdx => (
        React.createElement(React.Fragment, { key: `layer-${layerIdx}` },
          [...Array(nodesPerLayer)].map((_, nodeIdx) => {
            const nodeId = `node-${layerIdx}-${nodeIdx}`;
            const x = 20 + layerIdx * 30;
            const y = 10 + (nodeIdx * (100 - 20)) / (nodesPerLayer - 1);
            const isActive = activeNodes.includes(nodeId);
            
            return (
              <NNNode 
                key={nodeId}
                id={nodeId}
                active={isActive}
                x={x}
                y={y}
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
                return (
                  <NNConnection 
                    key={`${fromId}-to-${toId}`}
                    from={fromId}
                    to={toId}
                    active={activeNodes.includes(fromId) || activeNodes.includes(toId)}
                  />
                );
              })
            )
          ))
        )
      ))}
      
      {/* Dynamic training visualization elements */}
      {isTraining && (
        <>
          <div 
            className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-primary/10 to-transparent"
            style={{
              animation: `pulse ${3 - pulseIntensity}s infinite alternate`,
              opacity: 0.5 + (pulseIntensity * 0.2)
            }}
          ></div>
          <div className="absolute top-2 right-2 px-2 py-1 bg-primary/20 text-xs rounded-md animate-pulse">
            Training in progress...
          </div>
        </>
      )}
    </div>
  );
};

const Predictions = () => {
  const [pendingPredictions, setPendingPredictions] = useState<PendingPrediction[]>([]);
  const [completedPredictions, setCompletedPredictions] = useState<Prediction[]>([]);
  const [predictionTimePeriod, setPredictionTimePeriod] = useState(3);
  const [predictionConfidence, setPredictionConfidence] = useState(50);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [currentMarket, setCurrentMarket] = useState('R_10');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [predictionType, setPredictionType] = useState<'rise' | 'fall'>('rise');
  const { user } = useAuth();
  const autoIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const tickCounterRef = React.useRef<Map<number, number>>(new Map());
  
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
    },
    onOpen: () => {
      console.log('WebSocket connected for predictions');
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
          predictionType: item.prediction || 'rise'
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
            phase: 'completed',
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
    
    // Get last 20 ticks from WebSocket history
    const tickValues = ws.ticks.map(t => t.value);
    
    if (tickValues.length < 10) {
      return null; // Not enough data yet
    }
    
    // Generate a prediction using the neural network
    return neuralNetwork.predict(tickValues, 'rise', predictionTimePeriod as any, currentPrice)
      .then(prediction => {
        handleAddPrediction(
          prediction.type, 
          prediction.period, 
          Math.round(prediction.confidence * 100),
          true
        );
      })
      .catch(err => {
        console.error("Error generating prediction:", err);
      });
  }, [currentPrice, ws.ticks, isBotRunning, predictionTimePeriod]);
  
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
            toast.success('Bot started - auto predictions enabled');
            
            // Generate a prediction every 15 seconds
            autoIntervalRef.current = setInterval(generatePrediction, 15000);
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
    type: 'rise' | 'fall' | 'even' | 'odd' = 'rise',
    period: number = predictionTimePeriod, 
    confidence: number = predictionConfidence,
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
      phase: 'warning', // Start in warning phase
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
                phase: 'counting',
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
              <NeuralNetworkVisual isTraining={isTraining} />
              
              {/* Waiting for data message moved to the top */}
              {!currentPrice && (
                <div className="absolute top-0 right-0 text-muted-foreground bg-background/80 p-2 rounded-md">
                  Waiting for market data...
                </div>
              )}
              
              <div className="absolute top-1/4 right-8 text-lg font-semibold">
                {currentPrice && !isTraining && (
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-muted-foreground">Predicted movement:</span>
                    <div className="flex items-center gap-1 mt-1">
                      {predictionType === 'rise' ? (
                        <>
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          <span className="text-green-500">Rising</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-5 w-5 text-red-500" />
                          <span className="text-red-500">Falling</span>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-3">
                      <span className="text-sm text-muted-foreground">Confidence:</span>
                      <Progress value={predictionConfidence} className="h-2 w-32 mt-1" />
                    </div>
                  </div>
                )}
                
                {isTraining && (
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
                )}
              </div>
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
                  Confidence Level: {predictionConfidence}%
                </label>
                <input
                  type="range"
                  value={predictionConfidence}
                  onChange={(e) => setPredictionConfidence(Number(e.target.value))}
                  className="w-full"
                  min="1"
                  max="99"
                  disabled={isBotRunning}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">
                  Prediction Type
                </label>
                <div className="flex gap-2">
                  <Button 
                    variant={predictionType === 'rise' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setPredictionType('rise')}
                    className="flex-1"
                    disabled={isBotRunning}
                  >
                    <TrendingUp className="h-4 w-4 mr-1" /> Rise
                  </Button>
                  <Button 
                    variant={predictionType === 'fall' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setPredictionType('fall')}
                    className="flex-1"
                    disabled={isBotRunning}
                  >
                    <TrendingDown className="h-4 w-4 mr-1" /> Fall
                  </Button>
                </div>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={() => handleAddPrediction(predictionType, predictionTimePeriod, predictionConfidence)} 
                  className="w-full"
                  disabled={!currentPrice || isBotRunning || isPredicting}
                >
                  Make Prediction
                </Button>
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
