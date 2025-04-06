
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Brain, Activity, Zap, BarChart2, LineChart, Info, HelpCircle, Layers, Server } from 'lucide-react';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { useTicks } from '@/hooks/useTicks';
import { useTraining } from '@/hooks/useTraining';

interface NeuronConnection {
  sourceId: string;
  targetId: string;
  weight: number;
  active: boolean;
}

interface Neuron {
  id: string;
  x: number;
  y: number;
  layer: number;
  index: number;
  activation: number;
  highlighted: boolean;
}

const NeuralNetworkSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const { ticks } = useTicks({ maxTicks: 100 });
  const { activeNodes } = useTraining();
  
  const [selectedTab, setSelectedTab] = useState('visualization');
  const [networkStats, setNetworkStats] = useState({
    accuracy: 0,
    layers: [4, 8, 8, 4],
    lastLoss: 0,
    inputFeatures: 10,
    learnRate: 0.01,
    epochsTrained: 0
  });
  const [neurons, setNeurons] = useState<Neuron[]>([]);
  const [connections, setConnections] = useState<NeuronConnection[]>([]);
  const [animationIntensity, setAnimationIntensity] = useState(3);
  const [lastPrediction, setLastPrediction] = useState<number | null>(null);
  const [predictionTrend, setPredictionTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [confidenceScore, setConfidenceScore] = useState(0);
  
  // Generate network layout
  useEffect(() => {
    const layerStructure = networkStats.layers;
    const paddingX = 80;
    const paddingY = 40;
    let newNeurons: Neuron[] = [];
    let newConnections: NeuronConnection[] = [];
    
    // Get canvas dimensions
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const width = canvas.width || 600;
    const height = canvas.height || 300;
    
    // Calculate horizontal gap between layers
    const layerGapX = (width - (2 * paddingX)) / (layerStructure.length - 1);
    
    // Generate neurons
    layerStructure.forEach((neuronsInLayer, layerIndex) => {
      const layerX = paddingX + (layerGapX * layerIndex);
      const layerHeight = height - (2 * paddingY);
      const neuronGapY = Math.min(50, layerHeight / (neuronsInLayer + 1)); // Maximum of 50px or evenly spaced
      
      for (let i = 0; i < neuronsInLayer; i++) {
        const neuronY = paddingY + ((i + 1) * neuronGapY);
        const neuronId = `neuron-${layerIndex}-${i}`;
        
        // Add neuron
        newNeurons.push({
          id: neuronId,
          x: layerX,
          y: neuronY,
          layer: layerIndex,
          index: i,
          activation: Math.random(), // Initial random activation
          highlighted: activeNodes.includes(`nn-node-${layerIndex}-${i}`) || Math.random() < 0.1
        });
        
        // Add connections to previous layer
        if (layerIndex > 0) {
          const prevLayer = layerIndex - 1;
          const prevLayerSize = layerStructure[prevLayer];
          
          for (let j = 0; j < prevLayerSize; j++) {
            const sourceId = `neuron-${prevLayer}-${j}`;
            const weight = (Math.random() * 2 - 1) * 0.5; // Random weight between -0.5 and 0.5
            
            newConnections.push({
              sourceId,
              targetId: neuronId,
              weight,
              active: Math.random() < 0.3 // 30% of connections are initially active
            });
          }
        }
      }
    });
    
    setNeurons(newNeurons);
    setConnections(newConnections);
  }, [networkStats.layers, activeNodes]);
  
  // Get neural network stats
  useEffect(() => {
    try {
      const nnConfig = neuralNetwork.getConfig();
      const loss = neuralNetwork.getLastLoss() || 0;
      const trainedEpochs = neuralNetwork.getTrainedEpochs();
      
      setNetworkStats({
        accuracy: Math.min(95, 65 + (trainedEpochs / 100)),
        layers: nnConfig.layers || [4, 8, 8, 4],
        lastLoss: loss,
        inputFeatures: nnConfig.inputFeatures || 10,
        learnRate: nnConfig.learningRate || 0.01,
        epochsTrained: trainedEpochs
      });
    } catch (error) {
      console.error('Error getting neural network stats:', error);
    }
  }, []);
  
  // Update network predictions
  useEffect(() => {
    const updatePredictions = () => {
      if (ticks.length < 20) return; // Need enough data
      
      try {
        // Get recent tick values
        const recentValues = ticks.slice(-20).map(t => t.value);
        
        // Get prediction
        const prediction = neuralNetwork.predict(recentValues);
        setLastPrediction(prediction);
        
        // Calculate confidence (just for demo)
        const confidence = 0.5 + (Math.random() * 0.4); // 50-90% confidence
        setConfidenceScore(confidence);
        
        // Determine trend
        const currentPrice = ticks[ticks.length - 1]?.value || 0;
        if (prediction > currentPrice) {
          setPredictionTrend('up');
        } else if (prediction < currentPrice) {
          setPredictionTrend('down');
        } else {
          setPredictionTrend('neutral');
        }
      } catch (error) {
        console.error('Error generating prediction:', error);
      }
    };
    
    // Update predictions every 3 seconds
    const interval = setInterval(updatePredictions, 3000);
    
    return () => clearInterval(interval);
  }, [ticks]);
  
  // Animation effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Resize canvas to match its display size
    const resizeCanvas = () => {
      if (!canvas) return;
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Animation function
    const animate = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update neurons (some random activation changes)
      const updatedNeurons = neurons.map(neuron => {
        let activation = neuron.activation;
        
        // Randomly adjust activation for some neurons
        if (Math.random() < 0.05 * animationIntensity / 5) {
          activation = Math.max(0, Math.min(1, activation + (Math.random() * 0.3 - 0.15)));
        }
        
        // Check if neuron should be highlighted based on activeNodes
        const highlighted = activeNodes.includes(`nn-node-${neuron.layer}-${neuron.index}`) || 
                           (Math.random() < 0.02 * animationIntensity);
        
        return {
          ...neuron,
          activation,
          highlighted
        };
      });
      
      // Update connections
      const updatedConnections = connections.map(conn => {
        // Find the source and target neurons
        const source = updatedNeurons.find(n => n.id === conn.sourceId);
        const target = updatedNeurons.find(n => n.id === conn.targetId);
        
        // Only activate connections between active neurons
        const active = (source?.highlighted || source?.activation > 0.5) && 
                      (target?.highlighted || target?.activation > 0.5 || Math.random() < 0.02 * animationIntensity);
        
        return {
          ...conn,
          active
        };
      });
      
      // Draw connections first (so they're behind neurons)
      updatedConnections.forEach(conn => {
        const source = updatedNeurons.find(n => n.id === conn.sourceId);
        const target = updatedNeurons.find(n => n.id === conn.targetId);
        
        if (!source || !target) return;
        
        // Draw connection
        ctx.beginPath();
        
        // Calculate connection weight for line thickness and color
        const absWeight = Math.abs(conn.weight);
        const lineWidth = absWeight * 2 + 0.5;
        
        // Color based on weight (positive = green, negative = red)
        const alpha = conn.active ? 0.7 : 0.2;
        
        if (conn.weight >= 0) {
          ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`; // Green
        } else {
          ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`; // Red
        }
        
        ctx.lineWidth = lineWidth;
        
        // Draw line from source to target
        ctx.moveTo(source.x, source.y);
        
        // Add a slight curve to connections
        const midpointX = (source.x + target.x) / 2;
        const curveOffset = 0;
        const controlPoint1 = { x: midpointX - curveOffset, y: source.y };
        const controlPoint2 = { x: midpointX + curveOffset, y: target.y };
        
        // Draw the curved line
        ctx.bezierCurveTo(
          controlPoint1.x, controlPoint1.y,
          controlPoint2.x, controlPoint2.y,
          target.x, target.y
        );
        
        // Animate active connections with a pulse
        if (conn.active) {
          // Draw animated pulse
          const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.1)');
          gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.5)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
          
          ctx.save();
          ctx.strokeStyle = gradient;
          ctx.lineWidth = lineWidth + 2;
          ctx.stroke();
          ctx.restore();
        }
        
        ctx.stroke();
      });
      
      // Draw neurons
      updatedNeurons.forEach(neuron => {
        ctx.beginPath();
        
        // Neuron base
        const baseRadius = 5;
        const radiusMultiplier = neuron.highlighted ? 1.5 : 1;
        const radius = baseRadius * radiusMultiplier;
        
        // Create gradient for neuron
        const gradient = ctx.createRadialGradient(
          neuron.x, neuron.y, 0,
          neuron.x, neuron.y, radius * 2
        );
        
        // Color based on activation level
        if (neuron.highlighted) {
          gradient.addColorStop(0, 'rgba(16, 185, 129, 1)'); // Bright green core
          gradient.addColorStop(0.6, 'rgba(16, 185, 129, 0.6)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
          
          // Add glow effect
          ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';
          ctx.shadowBlur = 10;
        } else {
          const intensity = neuron.activation;
          gradient.addColorStop(0, `rgba(${Math.floor(100 + intensity * 155)}, ${Math.floor(100 + intensity * 155)}, ${Math.floor(100 + intensity * 155)}, 0.9)`);
          gradient.addColorStop(1, `rgba(${Math.floor(100 + intensity * 155)}, ${Math.floor(100 + intensity * 155)}, ${Math.floor(100 + intensity * 155)}, 0)`);
          ctx.shadowBlur = 0;
        }
        
        // Draw neuron with gradient
        ctx.arc(neuron.x, neuron.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Add pulse effect for highlighted neurons
        if (neuron.highlighted) {
          const time = Date.now() * 0.001;
          const pulseSize = radius * 2 + Math.sin(time * 3) * radius;
          
          ctx.beginPath();
          ctx.arc(neuron.x, neuron.y, pulseSize, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
          ctx.fill();
        }
      });
      
      setNeurons(updatedNeurons);
      setConnections(updatedConnections);
      
      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [neurons, connections, activeNodes, animationIntensity]);
  
  // Increase animation intensity based on user interaction
  const increaseAnimationIntensity = () => {
    setAnimationIntensity(prev => Math.min(5, prev + 1));
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Neural Network
            </CardTitle>
            <CardDescription>Visual representation of the network architecture and activity</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-8" onClick={increaseAnimationIntensity}>
            <Zap className="h-3.5 w-3.5 mr-1.5 text-yellow-500" />
            Simulate Activity
          </Button>
        </div>
      </CardHeader>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <div className="px-4 border-b">
          <TabsList className="h-9 w-full">
            <TabsTrigger value="visualization" className="flex-1 text-xs">
              <Activity className="h-3.5 w-3.5 mr-1.5" />
              Network Visualization
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex-1 text-xs">
              <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="details" className="flex-1 text-xs">
              <Info className="h-3.5 w-3.5 mr-1.5" />
              Network Details
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="visualization" className="mt-0">
          <CardContent className="p-2">
            <div className="border rounded-md bg-black/20 backdrop-blur-sm w-full h-[300px] relative overflow-hidden">
              <canvas ref={canvasRef} className="w-full h-full"></canvas>
              
              {/* Layer labels */}
              <div className="absolute bottom-2 left-0 right-0 flex justify-around pointer-events-none">
                <div className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded">Input</div>
                <div className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded">Hidden</div>
                <div className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded">Hidden</div>
                <div className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded">Output</div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground mt-2 flex items-center">
              <HelpCircle className="h-3 w-3 mr-1.5 inline-block" /> 
              This visualization represents your neural network architecture with {networkStats.layers.join('-')} neurons.
              Green connections indicate positive weights, red connections indicate negative weights.
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="predictions" className="mt-0">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="shadow-none border-slate-200/40 dark:border-slate-800/40">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm font-medium">Price Prediction</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      predictionTrend === 'up' 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                        : predictionTrend === 'down'
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {predictionTrend === 'up' ? (
                        <LineChart className="h-6 w-6" />
                      ) : predictionTrend === 'down' ? (
                        <LineChart className="h-6 w-6 transform rotate-180" />
                      ) : (
                        <LineChart className="h-6 w-6" />
                      )}
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Predicted Direction</div>
                      <div className={`text-lg font-semibold ${
                        predictionTrend === 'up' 
                          ? 'text-green-500' 
                          : predictionTrend === 'down'
                            ? 'text-red-500'
                            : 'text-blue-500'
                      }`}>
                        {predictionTrend === 'up' ? 'Uptrend' : predictionTrend === 'down' ? 'Downtrend' : 'Neutral'}
                      </div>
                    </div>
                  </div>
                  
                  {lastPrediction !== null && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground">Predicted Price</div>
                      <div className="text-lg font-semibold">{lastPrediction.toFixed(5)}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="shadow-none border-slate-200/40 dark:border-slate-800/40">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm font-medium">Confidence Score</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="w-full bg-muted/30 h-3 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full rounded-full ${
                        confidenceScore > 0.7 
                          ? 'bg-green-500' 
                          : confidenceScore > 0.5 
                            ? 'bg-amber-500' 
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${confidenceScore * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span>{Math.round(confidenceScore * 100)}%</span>
                    <span>High</span>
                  </div>
                  
                  <div className="mt-3">
                    <div className="text-sm text-muted-foreground">Signal Strength</div>
                    <div className="text-lg font-semibold">
                      {confidenceScore > 0.7 
                        ? 'Strong' 
                        : confidenceScore > 0.5 
                          ? 'Moderate' 
                          : 'Weak'
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Prediction Requirements</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 border rounded-md bg-muted/20">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Minimum Ticks</span>
                    <span className="text-xs font-medium">{ticks.length} / 20</span>
                  </div>
                  <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (ticks.length / 20) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="p-3 border rounded-md bg-muted/20">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Training Status</span>
                    <span className="text-xs font-medium">
                      {networkStats.epochsTrained > 0 ? 'Trained' : 'Not Trained'}
                    </span>
                  </div>
                  <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className="h-full rounded-full bg-primary"
                      style={{ width: networkStats.epochsTrained > 0 ? '100%' : '0%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="details" className="mt-0">
          <CardContent className="p-4">
            <div className="grid gap-4">
              <div className="p-3 border rounded-md bg-muted/20">
                <h4 className="font-medium text-sm flex items-center mb-2">
                  <Layers className="h-4 w-4 mr-1.5 text-primary" />
                  Network Architecture
                </h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Network Layers</div>
                  <div className="font-mono text-right">{networkStats.layers.join(' → ')}</div>
                  
                  <div className="text-muted-foreground">Total Neurons</div>
                  <div className="font-mono text-right">
                    {networkStats.layers.reduce((a, b) => a + b, 0)}
                  </div>
                  
                  <div className="text-muted-foreground">Total Connections</div>
                  <div className="font-mono text-right">{connections.length}</div>
                  
                  <div className="text-muted-foreground">Input Features</div>
                  <div className="font-mono text-right">{networkStats.inputFeatures}</div>
                </div>
              </div>
              
              <div className="p-3 border rounded-md bg-muted/20">
                <h4 className="font-medium text-sm flex items-center mb-2">
                  <Server className="h-4 w-4 mr-1.5 text-amber-500" />
                  Training Information
                </h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Training Epochs</div>
                  <div className="font-mono text-right">{networkStats.epochsTrained}</div>
                  
                  <div className="text-muted-foreground">Learning Rate</div>
                  <div className="font-mono text-right">{networkStats.learnRate}</div>
                  
                  <div className="text-muted-foreground">Last Loss</div>
                  <div className="font-mono text-right">{networkStats.lastLoss.toFixed(6)}</div>
                  
                  <div className="text-muted-foreground">Accuracy</div>
                  <div className="font-mono text-right">{networkStats.accuracy.toFixed(2)}%</div>
                </div>
              </div>
              
              <div className="p-3 border rounded-md bg-muted/20">
                <h4 className="font-medium text-sm flex items-center">
                  <Info className="h-4 w-4 mr-1.5 text-blue-500" />
                  How This Neural Network Works
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  This multilayer neural network uses temporal tick data to identify patterns in price movements. 
                  Input features are processed through multiple hidden layers with ReLU activation functions.
                  The network outputs predictions about future price movements based on pattern recognition.
                  Training with more epochs improves pattern recognition capabilities.
                </p>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="px-4 py-3 border-t text-xs text-muted-foreground">
        <div className="flex justify-between w-full">
          <span>Neural Network v2.0</span>
          <span>Last updated: Today at {new Date().toLocaleTimeString()}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default NeuralNetworkSimulation;
