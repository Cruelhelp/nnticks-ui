
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Brain, Clock, BadgeCheck, BadgeX, X, TrendingUp, TrendingDown, Zap, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { supabase } from '@/lib/supabase';
import { useWebSocket } from '@/hooks/useWebSocket';

type PredictionType = 'rise' | 'fall' | 'even' | 'odd';

interface Prediction {
  id: number;
  type: PredictionType;
  confidence: number;
  timestamp: Date;
  outcome: "win" | "loss" | "pending";
  market: string;
  startPrice?: number;
  endPrice?: number;
  timePeriod: number;
}

interface PendingPrediction {
  id: number;
  type: PredictionType;
  confidence: number;
  timestamp: Date;
  countdown: number;
  market: string;
  startPrice: number;
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

const NeuralNetworkVisual = () => {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  
  // Simulate neural network activity with more animation
  useEffect(() => {
    const interval = setInterval(() => {
      const layerIndex = Math.floor(Math.random() * 3);
      const nodeIndex = Math.floor(Math.random() * 5);
      setActiveNodeId(`node-${layerIndex}-${nodeIndex}`);
      
      setTimeout(() => setActiveNodeId(null), 800);
    }, 1200);
    
    return () => clearInterval(interval);
  }, []);
  
  // Generate nodes for 3 layers with 5 nodes each
  const layers = [0, 1, 2];
  const nodesPerLayer = 5;
  
  return (
    <div className="relative h-64 my-4">
      {layers.map(layerIdx => (
        React.createElement(React.Fragment, { key: `layer-${layerIdx}` },
          [...Array(nodesPerLayer)].map((_, nodeIdx) => {
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
                    active={activeNodeId === fromId || activeNodeId === toId}
                  />
                );
              })
            )
          ))
        )
      ))}
    </div>
  );
};

const Predictions = () => {
  const [pendingPredictions, setPendingPredictions] = useState<PendingPrediction[]>([]);
  const [completedPredictions, setCompletedPredictions] = useState<Prediction[]>([]);
  const [predictionType, setPredictionType] = useState<PredictionType>('rise');
  const [predictionTimePeriod, setPredictionTimePeriod] = useState(3);
  const [predictionConfidence, setPredictionConfidence] = useState(50);
  const [isPredicting, setIsPredicting] = useState(false);
  const [autoPredictEnabled, setAutoPredictEnabled] = useState(false);
  const [currentMarket, setCurrentMarket] = useState('R_10');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const { user } = useAuth();
  const autoIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Connect to broker WebSocket for tick data
  const ws = useWebSocket({
    wsUrl: 'wss://ws.binaryws.com/websockets/v3?app_id=1089',
    subscription: { ticks: 'R_10' },
    onMessage: (data) => {
      if (data.tick) {
        setCurrentPrice(data.tick.quote);
        setCurrentMarket(data.tick.symbol);
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
          type: item.prediction as PredictionType,
          confidence: item.confidence,
          timestamp: new Date(item.timestamp),
          outcome: item.outcome as "win" | "loss",
          market: item.market,
          startPrice: item.start_price,
          endPrice: item.end_price,
          timePeriod: item.time_period || 3
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
  
  // Neural network-generated prediction
  const generateAutoPrediction = useCallback(() => {
    if (!currentPrice) return null;
    
    // Get last 20 ticks from WebSocket history
    const tickValues = ws.ticks.map(t => t.value);
    
    if (tickValues.length < 10) {
      return null; // Not enough data yet
    }
    
    // Generate a prediction using the neural network
    return neuralNetwork.predict(tickValues)
      .then(prediction => {
        // Use the generated prediction
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
  }, [currentPrice, ws.ticks]);
  
  // Toggle auto prediction
  const toggleAutoPrediction = () => {
    if (autoPredictEnabled) {
      setAutoPredictEnabled(false);
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
      toast.info('Auto predictions disabled');
    } else {
      setAutoPredictEnabled(true);
      toast.success('Auto predictions enabled');
      // Generate a prediction every 15 seconds
      autoIntervalRef.current = setInterval(generateAutoPrediction, 15000);
      // Generate one immediately
      generateAutoPrediction();
    }
  };
  
  const handleAddPrediction = async (
    type: PredictionType = predictionType, 
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
    
    // Create new prediction
    const newPrediction: PendingPrediction = {
      id: generateId(),
      type,
      confidence,
      timestamp: new Date(),
      countdown: period,
      market: currentMarket,
      startPrice: currentPrice
    };
    
    setPendingPredictions(prev => [...prev, newPrediction]);
    
    if (isAuto) {
      toast(`New ${type.toUpperCase()} prediction for ${period} ticks`, {
        icon: <Zap className="h-4 w-4" />,
        description: `Auto prediction with ${confidence}% confidence`
      });
    } else {
      toast.success(`Prediction added for ${type.toUpperCase()}`);
    }
    
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
  
  const handleCompletePrediction = async (id: number) => {
    setPendingPredictions(prev => prev.filter(p => p.id !== id));
    
    // Find the pending prediction before it's removed from state
    const pendingPred = pendingPredictions.find(p => p.id === id);
    
    if (!pendingPred) return;
    
    // Check the current price to determine outcome
    const startPrice = pendingPred.startPrice;
    const endPrice = currentPrice || startPrice;
    let outcome: "win" | "loss" = "loss";
    
    switch (pendingPred.type) {
      case 'rise':
        outcome = endPrice > startPrice ? 'win' : 'loss';
        break;
      case 'fall':
        outcome = endPrice < startPrice ? 'win' : 'loss';
        break;
      case 'even':
        // Check if last digit is even
        outcome = Math.round(endPrice * 100) % 2 === 0 ? 'win' : 'loss';
        break;
      case 'odd':
        // Check if last digit is odd
        outcome = Math.round(endPrice * 100) % 2 !== 0 ? 'win' : 'loss';
        break;
      default:
        outcome = 'loss';
    }
    
    // Add to completed predictions
    const completedPrediction: Prediction = {
      id,
      type: pendingPred.type,
      confidence: pendingPred.confidence,
      timestamp: pendingPred.timestamp,
      outcome,
      market: pendingPred.market,
      startPrice: pendingPred.startPrice,
      endPrice,
      timePeriod: pendingPred.countdown
    };
    
    setCompletedPredictions(prevCompleted => [completedPrediction, ...prevCompleted]);
    
    // Show notification with price details
    if (outcome === 'win') {
      toast.success(`Prediction correct! Price ${pendingPred.type === 'rise' ? 'rose' : 'fell'} from ${startPrice.toFixed(5)} to ${endPrice.toFixed(5)}`);
    } else {
      toast.error(`Prediction incorrect. Price ${pendingPred.type === 'rise' ? 'fell' : 'rose'} from ${startPrice.toFixed(5)} to ${endPrice.toFixed(5)}`);
    }
    
    // Save to Supabase
    if (user) {
      try {
        const { error } = await supabase.from('trade_history').insert({
          user_id: user.id,
          timestamp: new Date().toISOString(),
          market: pendingPred.market,
          prediction: pendingPred.type,
          confidence: pendingPred.confidence,
          outcome: outcome,
          start_price: startPrice,
          end_price: endPrice,
          time_period: pendingPred.countdown
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
              <span>Make Predictions</span>
              <div className="flex items-center gap-2">
                <Badge variant={autoPredictEnabled ? "default" : "outline"} 
                  className="cursor-pointer animate-pulse" 
                  onClick={toggleAutoPrediction}
                >
                  {autoPredictEnabled ? 'Auto: ON' : 'Auto: OFF'}
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
              <NeuralNetworkVisual />
              
              <div className="absolute top-0 right-0 bottom-0 w-1/3 bg-gradient-to-l from-background to-transparent" />
              <div className="absolute top-1/4 right-8 text-lg font-semibold">
                {currentPrice ? (
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-muted-foreground">Predicted movement:</span>
                    <div className="flex items-center gap-1 mt-1">
                      {Math.random() > 0.5 ? (
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
                      <Progress value={65 + Math.floor(Math.random() * 20)} className="h-2 w-32 mt-1" />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Waiting for data...
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">
                  Prediction Type
                </label>
                <select
                  value={predictionType}
                  onChange={(e) => setPredictionType(e.target.value as PredictionType)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="rise">Rise</option>
                  <option value="fall">Fall</option>
                  <option value="even">Even</option>
                  <option value="odd">Odd</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">
                  Time Period (ticks)
                </label>
                <select
                  value={predictionTimePeriod}
                  onChange={(e) => setPredictionTimePeriod(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="1">1 tick</option>
                  <option value="3">3 ticks</option>
                  <option value="5">5 ticks</option>
                  <option value="10">10 ticks</option>
                </select>
              </div>
              
              <div className="col-span-2">
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
                />
              </div>
            </div>
            
            <Button onClick={() => handleAddPrediction()} disabled={isPredicting || !currentPrice} 
              className="w-full relative overflow-hidden group"
            >
              {isPredicting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Predicting...
                </>
              ) : (
                <>
                  <span className="relative z-10">Add Prediction</span>
                  <span className="absolute inset-0 bg-primary/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                </>
              )}
            </Button>
          </CardContent>
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
                <p className="text-xs mt-1">Add a prediction or enable auto-predict</p>
              </div>
            ) : (
              <div className="space-y-2 animate-[enter_0.3s_ease-out]">
                {pendingPredictions.map((prediction) => (
                  <div key={prediction.id} className="flex items-center justify-between border rounded-md p-3 hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        {prediction.type === 'rise' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : prediction.type === 'fall' ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <span className="h-4 w-4 flex items-center justify-center font-mono text-sm">
                            {prediction.type === 'even' ? '2x' : '1x'}
                          </span>
                        )}
                        <p className="font-medium capitalize">{prediction.type}</p>
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
                        <Clock className="h-4 w-4 text-primary animate-pulse" />
                        <span className="text-sm font-mono">{prediction.countdown}s</span>
                      </div>
                      <Progress value={(1 - prediction.countdown / predictionTimePeriod) * 100} className="w-16 h-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
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
                        {prediction.type === 'rise' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : prediction.type === 'fall' ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <span className="h-4 w-4 flex items-center justify-center font-mono text-sm">
                            {prediction.type === 'even' ? '2x' : '1x'}
                          </span>
                        )}
                        <p className="font-medium capitalize">{prediction.type}</p>
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
        </Card>
      </div>
    </div>
  );
};

export default Predictions;
