import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NeuralNetHistory from './NeuralNetHistory';
import { Brain, GitBranch, Settings, TrendingUp, TrendingDown, Save, Upload, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useWebSocket } from '@/hooks/useWebSocket';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { neuralNetwork, NNConfiguration, DEFAULT_NN_CONFIG } from '@/lib/neuralNetwork';

type PredictionPhase = 'warning' | 'counting' | 'completed';

interface PendingPrediction {
  id: number;
  confidence: number;
  timestamp: Date;
  warningCountdown: number;
  tickCountdown: number;
  phase: PredictionPhase;
  market: string;
  startPrice: number;
  tickPeriod: number;
  ticksElapsed: number;
  predictionType: 'rise' | 'fall' | 'even' | 'odd';
}

const NeuralNet = () => {
  const [activeTab, setActiveTab] = useState('history');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionType, setPredictionType] = useState<'rise' | 'fall'>('rise');
  const [tickPeriod, setTickPeriod] = useState(3);
  const [currentConfig, setCurrentConfig] = useState<NNConfiguration>(DEFAULT_NN_CONFIG);
  const [pendingPredictions, setPendingPredictions] = useState<PendingPrediction[]>([]);
  const [completedPredictions, setCompletedPredictions] = useState<any[]>([]);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const ws = useWebSocket({
    subscription: { ticks: 'R_10' },
    onMessage: (data) => {
      if (data.tick) {
        handleNewTick(data.tick.quote);
      }
    }
  });

  useEffect(() => {
    setCurrentConfig(neuralNetwork.getConfig());
    
    if (user) {
      loadPredictions();
    }
  }, [user]);

  const loadPredictions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('trade_history')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCompletedPredictions(data.map(item => ({
          id: item.id,
          type: item.prediction,
          market: item.market,
          confidence: item.confidence,
          timestamp: new Date(item.timestamp),
          outcome: item.outcome,
          startPrice: item.start_price,
          endPrice: item.end_price,
          timePeriod: item.time_period
        })));
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  const handleNewTick = (price: number) => {
    setPendingPredictions(prevPredictions => {
      const updatedPredictions = prevPredictions.map(prediction => {
        if (prediction.phase !== 'counting') {
          return prediction;
        }
        
        const newTicksElapsed = prediction.ticksElapsed + 1;
        
        if (newTicksElapsed >= prediction.tickPeriod) {
          setTimeout(() => {
            handleCompletePrediction(prediction.id, price);
          }, 100);
          
          return {
            ...prediction,
            phase: 'completed',
            ticksElapsed: prediction.tickPeriod
          };
        }
        
        return {
          ...prediction,
          ticksElapsed: newTicksElapsed
        };
      });
      
      return updatedPredictions;
    });
  };

  const handleCompletePrediction = async (id: number, finalPrice: number) => {
    const prediction = pendingPredictions.find(p => p.id === id);
    
    if (!prediction) return;
    
    const startPrice = prediction.startPrice;
    const endPrice = finalPrice;
    let outcome: "win" | "loss" = "loss";
    
    switch (prediction.type) {
      case 'rise':
        outcome = endPrice > startPrice ? "win" : "loss";
        break;
      case 'fall':
        outcome = endPrice < startPrice ? "win" : "loss";
        break;
      default:
        outcome = "loss";
    }
    
    setPendingPredictions(prev => prev.filter(p => p.id !== id));
    
    const completedPrediction = {
      id,
      type: prediction.type,
      market: prediction.market,
      confidence: prediction.confidence,
      timestamp: prediction.timestamp,
      outcome,
      startPrice,
      endPrice,
      timePeriod: prediction.tickPeriod
    };
    
    setCompletedPredictions(prev => [completedPrediction, ...prev]);
    
    if (outcome === 'win') {
      toast.success(`Prediction correct! Market ${prediction.type === 'rise' ? 'rose' : 'fell'} from ${startPrice.toFixed(5)} to ${endPrice.toFixed(5)}`);
    } else {
      toast.error(`Prediction incorrect. Market ${prediction.type === 'rise' ? 'fell' : 'rose'} from ${startPrice.toFixed(5)} to ${endPrice.toFixed(5)}`);
    }
    
    if (user) {
      try {
        await supabase.from('trade_history').insert({
          user_id: user.id,
          timestamp: new Date().toISOString(),
          market: prediction.market,
          prediction: prediction.type,
          confidence: prediction.confidence,
          outcome,
          start_price: startPrice,
          end_price: endPrice,
          time_period: prediction.tickPeriod
        });
        
        const currentTicks = ws.ticks.map(t => t.value);
        await supabase.from('training_history').insert({
          user_id: user.id,
          date: new Date().toISOString(),
          model_data: {
            inputs: currentTicks.slice(-20),
            prediction: prediction.type,
            actual: outcome === 'win' ? prediction.type : (prediction.type === 'rise' ? 'fall' : 'rise'),
            weights: neuralNetwork.exportModel().weights
          },
          accuracy: outcome === 'win' ? 1 : 0,
          points: outcome === 'win' ? 1 : 0,
          mission: `Prediction ${prediction.type}`
        });
      } catch (error) {
        console.error('Error saving prediction to Supabase:', error);
      }
    }
  };

  const handleAddPrediction = async () => {
    if (isPredicting || !ws.latestTick) return;
    
    setIsPredicting(true);
    
    try {
      const tickValues = ws.ticks.map(t => t.value);
      
      if (tickValues.length < 10) {
        toast.error('Not enough tick data available. Please wait.');
        setIsPredicting(false);
        return;
      }
      
      const prediction = await neuralNetwork.predict(
        tickValues,
        predictionType,
        tickPeriod as any,
        ws.latestTick.value
      );
      
      const newPrediction: PendingPrediction = {
        id: Date.now(),
        type: predictionType,
        market: ws.latestTick.market || 'Unknown',
        confidence: Math.round(prediction.confidence * 100),
        timestamp: new Date(),
        warningCountdown: 10,
        phase: 'warning',
        startPrice: ws.latestTick.value,
        tickPeriod,
        ticksElapsed: 0,
        tickCountdown: 0,
        predictionType
      };
      
      setPendingPredictions(prev => [...prev, newPrediction]);
      
      toast.success(`New prediction: Market will ${predictionType} after 10s + ${tickPeriod} ticks`);
      
      let countdown = 10;
      const warningInterval = setInterval(() => {
        countdown -= 1;
        
        if (countdown <= 0) {
          clearInterval(warningInterval);
          
          setPendingPredictions(prev => 
            prev.map(p => p.id === newPrediction.id ? {
              ...p,
              phase: 'counting' as PredictionPhase,
              warningCountdown: 0,
              startPrice: ws.latestTick?.value || p.startPrice
            } : p)
          );
          
          toast(`Starting tick count for ${tickPeriod} ticks`, {
            description: `Initial price: ${ws.latestTick?.value?.toFixed(5)}`
          });
        } else {
          setPendingPredictions(prev => 
            prev.map(p => p.id === newPrediction.id ? {
              ...p,
              warningCountdown: countdown
            } : p)
          );
        }
      }, 1000);
    } catch (error) {
      console.error('Error making prediction:', error);
      toast.error('Failed to make prediction');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleTrainModel = async () => {
    if (isTraining) return;
    
    setIsTraining(true);
    setTrainingProgress(0);
    
    try {
      const tickValues = ws.ticks.map(t => t.value);
      
      if (tickValues.length < 100) {
        toast.error('Not enough tick data available for training. Need at least 100 ticks.');
        setIsTraining(false);
        return;
      }
      
      const updateProgress = (progress: number) => {
        setTrainingProgress(progress * 100);
      };
      
      const accuracy = await neuralNetwork.train(tickValues, {
        maxEpochs: currentConfig.epochs,
        onProgress: updateProgress
      });
      
      if (user) {
        const model = neuralNetwork.exportModel();
        await supabase.from('models').insert({
          user_id: user.id,
          name: `Model-${new Date().toISOString().split('T')[0]}`,
          description: `Trained with ${currentConfig.epochs} epochs`,
          config: currentConfig,
          accuracy,
          weights: model.weights,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      toast.success(`Model trained successfully with ${accuracy.toFixed(2) * 100}% accuracy`);
      
      setActiveTab('history');
    } catch (error) {
      console.error('Error training model:', error);
      toast.error('Failed to train model');
    } finally {
      setIsTraining(false);
      setTrainingProgress(100);
    }
  };

  const handleSaveModel = () => {
    try {
      neuralNetwork.saveModelToFile();
      toast.success('Model saved successfully');
    } catch (error) {
      console.error('Error saving model:', error);
      toast.error('Failed to save model');
    }
  };

  const handleImportModel = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const success = await neuralNetwork.loadModelFromFile(file);
      if (success) {
        toast.success('Model imported successfully');
        setCurrentConfig(neuralNetwork.getConfig());
        setActiveTab('history');
      } else {
        toast.error('Failed to import model');
      }
    } catch (error) {
      console.error('Error importing model:', error);
      toast.error('Failed to import model');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfigChange = (key: keyof NNConfiguration, value: any) => {
    const updatedConfig = { ...currentConfig, [key]: value };
    setCurrentConfig(updatedConfig);
    neuralNetwork.updateConfig(updatedConfig);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Neural Network Management</h1>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveModel}>
            <Download className="h-4 w-4 mr-2" />
            Save Model
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportModel}>
            <Upload className="h-4 w-4 mr-2" />
            Import Model
          </Button>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".json"
            onChange={handleFileSelected}
          />
          <Button size="sm" onClick={handleTrainModel} disabled={isTraining}>
            <Brain className="h-4 w-4 mr-2" />
            {isTraining ? 'Training...' : 'Train Model'}
          </Button>
        </div>
      </div>
      
      {isTraining && (
        <div className="w-full">
          <div className="flex justify-between items-center text-sm mb-1">
            <span>Training Progress</span>
            <span>{Math.round(trainingProgress)}%</span>
          </div>
          <Progress value={trainingProgress} className="h-2" />
        </div>
      )}
      
      <Tabs defaultValue="history" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="history">Model History</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Advanced Settings
          </Button>
        </div>
        
        <TabsContent value="history">
          <NeuralNetHistory />
        </TabsContent>
        
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Neural Network Configuration</CardTitle>
              <CardDescription>
                Configure your neural network model parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Learning Rate: {currentConfig.learningRate}</Label>
                    <Slider
                      value={[currentConfig.learningRate * 1000]}
                      min={1}
                      max={100}
                      step={1}
                      onValueChange={(values) => handleConfigChange('learningRate', values[0] / 1000)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label>Epochs: {currentConfig.epochs}</Label>
                    <Slider
                      value={[currentConfig.epochs]}
                      min={10}
                      max={1000}
                      step={10}
                      onValueChange={(values) => handleConfigChange('epochs', values[0])}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label>Activation Function</Label>
                    <Select 
                      value={currentConfig.activationFunction}
                      onValueChange={(value: 'relu' | 'sigmoid' | 'tanh') => handleConfigChange('activationFunction', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select activation function" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relu">ReLU</SelectItem>
                        <SelectItem value="sigmoid">Sigmoid</SelectItem>
                        <SelectItem value="tanh">Tanh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Network Layers</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div>
                        <Label className="text-xs">Input Layer</Label>
                        <Input 
                          type="number" 
                          value={currentConfig.layers[0]}
                          onChange={(e) => {
                            const newLayers = [...currentConfig.layers];
                            newLayers[0] = Number(e.target.value);
                            handleConfigChange('layers', newLayers);
                          }}
                          min={1}
                          max={128}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Hidden Layer</Label>
                        <Input 
                          type="number" 
                          value={currentConfig.layers[1]}
                          onChange={(e) => {
                            const newLayers = [...currentConfig.layers];
                            newLayers[1] = Number(e.target.value);
                            handleConfigChange('layers', newLayers);
                          }}
                          min={1}
                          max={128}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Output Layer</Label>
                        <Input 
                          type="number" 
                          value={currentConfig.layers[2]}
                          onChange={(e) => {
                            const newLayers = [...currentConfig.layers];
                            newLayers[2] = Number(e.target.value);
                            handleConfigChange('layers', newLayers);
                          }}
                          min={1}
                          max={16}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Label>Connection Diagram</Label>
                    <div className="border rounded-md p-4 mt-2 h-32 relative">
                      {currentConfig.layers.map((neurons, layerIndex) => (
                        <div 
                          key={layerIndex}
                          className="absolute"
                          style={{
                            left: `${(layerIndex / (currentConfig.layers.length - 1)) * 80 + 10}%`,
                            top: '10%',
                            height: '80%',
                          }}
                        >
                          {Array.from({ length: Math.min(5, neurons) }).map((_, neuronIndex) => (
                            <div
                              key={neuronIndex}
                              className="absolute w-3 h-3 bg-primary rounded-full"
                              style={{
                                top: `${(neuronIndex / Math.min(4, neurons - 1)) * 100}%`,
                              }}
                            />
                          ))}
                          {neurons > 5 && (
                            <div className="absolute w-3 h-3 text-xs flex items-center justify-center bottom-0">
                              +{neurons - 5}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleTrainModel} disabled={isTraining}>
                  {isTraining ? 'Training...' : 'Train with these Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="predictions">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Create Prediction</CardTitle>
                <CardDescription>
                  Use neural network to predict market movements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Prediction Type</Label>
                    <div className="flex gap-2 mt-2">
                      <Button 
                        variant={predictionType === 'rise' ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setPredictionType('rise')}
                        className="flex-1"
                      >
                        <TrendingUp className="h-4 w-4 mr-1" /> Rise
                      </Button>
                      <Button 
                        variant={predictionType === 'fall' ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setPredictionType('fall')}
                        className="flex-1"
                      >
                        <TrendingDown className="h-4 w-4 mr-1" /> Fall
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Tick Period</Label>
                    <Select 
                      value={tickPeriod.toString()} 
                      onValueChange={(value) => setTickPeriod(Number(value))}
                    >
                      <SelectTrigger className="mt-2 w-[120px]">
                        <SelectValue placeholder="Select ticks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 tick</SelectItem>
                        <SelectItem value="3">3 ticks</SelectItem>
                        <SelectItem value="5">5 ticks</SelectItem>
                        <SelectItem value="10">10 ticks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-center my-4">
                  <div className="text-center">
                    <p className="text-sm mb-2">Current WebSocket Status:</p>
                    <Badge variant={ws.isConnected ? "default" : "destructive"}>
                      {ws.isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                    {ws.latestTick && (
                      <p className="mt-2 text-sm">
                        Latest price: {ws.latestTick.value.toFixed(5)}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleAddPrediction}
                  disabled={!ws.isConnected || isPredicting || !ws.latestTick}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Prediction
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Pending Predictions</CardTitle>
                <CardDescription>
                  Predictions in progress
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] overflow-y-auto">
                {pendingPredictions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No pending predictions</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Generate a prediction to see real-time results
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPredictions.map((prediction) => (
                      <div 
                        key={prediction.id} 
                        className="border rounded-md p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <Brain className="h-4 w-4 text-primary" />
                              <p className="font-medium">
                                Prediction: {prediction.type.toUpperCase()}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {prediction.market} • {prediction.confidence}% confidence
                            </p>
                            <p className="text-xs mt-1">
                              Start price: {prediction.startPrice.toFixed(5)}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            {prediction.phase === 'warning' ? (
                              <>
                                <Badge variant="outline" className="mb-1">
                                  Warning: {prediction.warningCountdown}s
                                </Badge>
                                <Progress 
                                  value={(10 - prediction.warningCountdown) * 10} 
                                  className="w-20 h-1"
                                />
                              </>
                            ) : prediction.phase === 'counting' ? (
                              <>
                                <Badge variant="outline" className="mb-1">
                                  Ticks: {prediction.ticksElapsed}/{prediction.tickPeriod}
                                </Badge>
                                <Progress 
                                  value={(prediction.ticksElapsed / prediction.tickPeriod) * 100} 
                                  className="w-20 h-1"
                                />
                              </>
                            ) : (
                              <Badge variant="outline">Evaluating...</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Completed Predictions</CardTitle>
                <CardDescription>
                  Recent prediction results
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[300px] overflow-y-auto">
                {completedPredictions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No completed predictions</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your prediction history will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedPredictions.map((prediction) => (
                      <div 
                        key={prediction.id} 
                        className={`border rounded-md p-3 hover:bg-muted/50 transition-colors ${
                          prediction.outcome === 'win' ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={prediction.outcome === 'win' ? "success" : "destructive"}>
                                {prediction.outcome === 'win' ? 'Correct' : 'Incorrect'}
                              </Badge>
                              <p className="font-medium">
                                {prediction.type.toUpperCase()}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {prediction.market} • {prediction.confidence}% confidence
                            </p>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">Start Price:</p>
                                <p className="font-medium">{prediction.startPrice?.toFixed(5)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">End Price:</p>
                                <p className="font-medium">{prediction.endPrice?.toFixed(5)}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {new Date(prediction.timestamp).toLocaleString()}
                            </p>
                            <p className="text-xs mt-1">
                              Tick period: {prediction.timePeriod}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="outline" size="sm" className="ml-auto" onClick={loadPredictions}>
                  Refresh History
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NeuralNet;
