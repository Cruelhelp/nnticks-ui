
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Download, Save, FileCode, BarChart } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { neuralNetwork } from '@/lib/neuralNetwork';

// Canvas-based neural network visualization
const AnimatedNeuralNetwork = ({ 
  inputNodes = 5,
  hiddenLayers = [8, 6], 
  outputNodes = 2,
  active = false,
  speed = 1
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [time, setTime] = useState(0);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.parentElement?.clientWidth || 600;
    canvas.height = canvas.parentElement?.clientHeight || 400;
    
    const layers = [inputNodes, ...hiddenLayers, outputNodes];
    const nodes: any[][] = [];
    
    // Generate nodes
    for (let l = 0; l < layers.length; l++) {
      const layerNodes = [];
      const nodeCount = layers[l];
      
      for (let n = 0; n < nodeCount; n++) {
        const x = (l / (layers.length - 1)) * canvas.width * 0.8 + canvas.width * 0.1;
        const y = ((n + 0.5) / nodeCount) * canvas.height * 0.8 + canvas.height * 0.1;
        
        layerNodes.push({
          x,
          y,
          active: false,
          value: Math.random()
        });
      }
      
      nodes.push(layerNodes);
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update activation wave
      if (active) {
        setTime(prev => (prev + 0.01 * speed) % 100);
        
        // Update node activation state based on time
        const activationLayer = Math.floor(time * layers.length / 100) % layers.length;
        
        for (let l = 0; l < nodes.length; l++) {
          for (let n = 0; n < nodes[l].length; n++) {
            const t = time * speed;
            
            // Use a sine wave to oscillate node activation
            nodes[l][n].value = 0.5 + 0.5 * Math.sin(t + l + n);
            
            // Set active state based on current activation wave
            nodes[l][n].active = l <= activationLayer || 
              Math.random() > 0.95; // Random activations
          }
        }
      }
      
      // Draw connections between layers
      ctx.lineWidth = 1;
      
      for (let l = 0; l < nodes.length - 1; l++) {
        for (let n1 = 0; n1 < nodes[l].length; n1++) {
          for (let n2 = 0; n2 < nodes[l + 1].length; n2++) {
            const node1 = nodes[l][n1];
            const node2 = nodes[l + 1][n2];
            
            let opacity = 0.1; // Default low opacity
            let width = 0.5;
            
            // Increase opacity for active connections
            if (node1.active && node2.active) {
              opacity = 0.6;
              width = 1.5;
            } else if (node1.active || node2.active) {
              opacity = 0.3;
              width = 1;
            }
            
            // Draw connection
            ctx.beginPath();
            ctx.moveTo(node1.x, node1.y);
            ctx.lineTo(node2.x, node2.y);
            ctx.strokeStyle = `rgba(150, 150, 150, ${opacity})`;
            ctx.lineWidth = width;
            ctx.stroke();
          }
        }
      }
      
      // Draw nodes
      for (let l = 0; l < nodes.length; l++) {
        for (let n = 0; n < nodes[l].length; n++) {
          const node = nodes[l][n];
          
          ctx.beginPath();
          ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
          
          if (node.active) {
            // Active node
            const glowSize = 12 + 4 * Math.sin(time * 5);
            
            // Outer glow
            const gradient = ctx.createRadialGradient(node.x, node.y, 3, node.x, node.y, glowSize);
            gradient.addColorStop(0, 'rgba(131, 111, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(131, 111, 255, 0)');
            
            ctx.fillStyle = 'rgba(131, 111, 255, 1)';
            ctx.fill();
            
            // Create the glow effect
            ctx.beginPath();
            ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
          } else {
            // Inactive node
            ctx.fillStyle = 'rgba(150, 150, 150, 0.3)';
            ctx.fill();
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [inputNodes, hiddenLayers, outputNodes, active, speed]);
  
  return (
    <div className="relative w-full h-full bg-black/5 rounded-md">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

const NeuralNet = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [networkConfig, setNetworkConfig] = useState(neuralNetwork.getConfig());
  const [accuracy, setAccuracy] = useState(0);
  
  const handleStartTraining = async () => {
    setIsTraining(true);
    setProgress(0);
    
    try {
      // Generate test data
      const testData = Array(200).fill(0).map(() => Math.random() * 10 + 90);
      
      // Configure neural network
      neuralNetwork.updateConfig(networkConfig);
      
      // Progress tracker
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 1, 99));
      }, 50);
      
      // Train the model
      const accuracyResult = await neuralNetwork.train(testData);
      clearInterval(progressInterval);
      setProgress(100);
      setAccuracy(accuracyResult * 100);
      
      toast.success(`Training complete with ${accuracyResult.toFixed(2) * 100}% accuracy`);
    } catch (error) {
      console.error('Training error:', error);
      toast.error('Training failed');
    } finally {
      setIsTraining(false);
    }
  };
  
  const handleSaveModel = () => {
    // Create a JSON representation of the model
    const modelData = {
      config: networkConfig,
      accuracy,
      timestamp: new Date().toISOString()
    };
    
    // Convert to a downloadable file
    const dataStr = JSON.stringify(modelData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `nnticks-model-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Model saved to your device');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Neural Network</h2>
      
      <Tabs defaultValue="visualization" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visualization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Network Architecture</CardTitle>
                  <Badge variant={isTraining ? "default" : "outline"}>
                    {isTraining ? 'Training' : 'Idle'}
                  </Badge>
                </div>
                <CardDescription>
                  Visualization of neural network topology and activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <AnimatedNeuralNetwork 
                    inputNodes={networkConfig.layers[0]} 
                    hiddenLayers={networkConfig.layers.slice(1, -1)} 
                    outputNodes={networkConfig.layers[networkConfig.layers.length-1]}
                    active={isTraining}
                    speed={2}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Architecture: {networkConfig.layers.join('-')}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    disabled={isTraining} 
                    onClick={handleSaveModel}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button 
                    variant={isTraining ? "secondary" : "default"} 
                    disabled={isTraining}
                    onClick={handleStartTraining}
                  >
                    {isTraining ? (
                      <>
                        <Brain className="mr-2 h-4 w-4 animate-pulse" />
                        Training... ({progress}%)
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Train Network
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Training Status</CardTitle>
                <CardDescription>
                  Current training progress and metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Accuracy</p>
                      <p className="text-2xl font-bold">{accuracy.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Loss</p>
                      <p className="text-2xl font-bold">{(10 - accuracy/10).toFixed(3)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Epochs</p>
                      <p className="text-xl">{networkConfig.epochs}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Learning Rate</p>
                      <p className="text-xl">{networkConfig.learningRate}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Neural Network Configuration</CardTitle>
              <CardDescription>
                Customize the network architecture and training parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="layers">Network Architecture</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input 
                      id="inputLayer" 
                      value={networkConfig.layers[0]} 
                      onChange={(e) => {
                        const newVal = parseInt(e.target.value);
                        if (!isNaN(newVal) && newVal > 0) {
                          const newLayers = [...networkConfig.layers];
                          newLayers[0] = newVal;
                          setNetworkConfig({...networkConfig, layers: newLayers});
                        }
                      }}
                      className="w-16 text-center"
                      type="number"
                      min="1"
                    />
                    <span className="text-muted-foreground">→</span>
                    {networkConfig.layers.slice(1, -1).map((layer, idx) => (
                      <React.Fragment key={idx}>
                        <Input 
                          value={layer}
                          onChange={(e) => {
                            const newVal = parseInt(e.target.value);
                            if (!isNaN(newVal) && newVal > 0) {
                              const newLayers = [...networkConfig.layers];
                              newLayers[idx + 1] = newVal;
                              setNetworkConfig({...networkConfig, layers: newLayers});
                            }
                          }}
                          className="w-16 text-center"
                          type="number"
                          min="1"
                        />
                        <span className="text-muted-foreground">→</span>
                      </React.Fragment>
                    ))}
                    <Input 
                      id="outputLayer" 
                      value={networkConfig.layers[networkConfig.layers.length-1]} 
                      onChange={(e) => {
                        const newVal = parseInt(e.target.value);
                        if (!isNaN(newVal) && newVal > 0) {
                          const newLayers = [...networkConfig.layers];
                          newLayers[newLayers.length - 1] = newVal;
                          setNetworkConfig({...networkConfig, layers: newLayers});
                        }
                      }}
                      className="w-16 text-center"
                      type="number"
                      min="1"
                    />
                    <Button variant="outline" size="sm" onClick={() => {
                      const newLayers = [...networkConfig.layers];
                      newLayers.splice(newLayers.length-1, 0, 16);
                      setNetworkConfig({...networkConfig, layers: newLayers});
                    }}>
                      Add Layer
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Learning Rate: {networkConfig.learningRate}</Label>
                  <Slider
                    defaultValue={[networkConfig.learningRate * 100]}
                    max={50}
                    min={1}
                    step={1}
                    onValueChange={(value) => {
                      setNetworkConfig({...networkConfig, learningRate: value[0] / 100});
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Training Epochs: {networkConfig.epochs}</Label>
                  <Slider
                    defaultValue={[networkConfig.epochs]}
                    max={200}
                    min={10}
                    step={10}
                    onValueChange={(value) => {
                      setNetworkConfig({...networkConfig, epochs: value[0]});
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="activation">Activation Function</Label>
                  <Select 
                    value={networkConfig.activationFunction} 
                    onValueChange={(val: any) => setNetworkConfig({
                      ...networkConfig, 
                      activationFunction: val
                    })}
                  >
                    <SelectTrigger id="activation">
                      <SelectValue placeholder="Select activation function" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relu">ReLU</SelectItem>
                      <SelectItem value="sigmoid">Sigmoid</SelectItem>
                      <SelectItem value="tanh">Tanh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-2">
                  <Label className="text-base">Advanced Settings</Label>
                  <div className="rounded-md border p-4 mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="dropout">Use Dropout</Label>
                        <p className="text-sm text-muted-foreground">
                          Helps prevent overfitting
                        </p>
                      </div>
                      <Switch id="dropout" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="batch">Batch Normalization</Label>
                        <p className="text-sm text-muted-foreground">
                          Accelerates training
                        </p>
                      </div>
                      <Switch id="batch" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="save">Auto-save Best Models</Label>
                        <p className="text-sm text-muted-foreground">
                          Save when accuracy improves
                        </p>
                      </div>
                      <Switch id="save" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setNetworkConfig(neuralNetwork.getConfig())}>
                Reset to Default
              </Button>
              <Button onClick={() => {
                neuralNetwork.updateConfig(networkConfig);
                toast.success('Configuration updated');
              }}>
                Apply Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Saved Models</span>
                <Button size="sm">
                  <FileCode className="mr-2 h-4 w-4" /> Import Model
                </Button>
              </CardTitle>
              <CardDescription>
                Manage your trained neural network models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border divide-y">
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Default Model</h4>
                      <p className="text-sm text-muted-foreground">Created on {new Date().toLocaleDateString()}</p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Architecture</p>
                      <p className="font-mono text-sm">{networkConfig.layers.join('-')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                      <p>{accuracy.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p>84 KB</p>
                    </div>
                  </div>
                </div>
                
                {/* Sample saved model */}
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Market Trend Model</h4>
                      <p className="text-sm text-muted-foreground">Created on {new Date(Date.now() - 86400000).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Load</Button>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Evaluation results and prediction accuracy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border">
                  <CardContent className="p-4">
                    <div>
                      <h3 className="text-base font-semibold mb-1">Accuracy</h3>
                      <div className="text-3xl font-bold">{accuracy.toFixed(1)}%</div>
                      
                      <div className="space-y-1 mt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Test Set</span>
                          <span>{(accuracy * 0.9).toFixed(1)}%</span>
                        </div>
                        <Progress value={accuracy * 0.9} className="h-1" />
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Validation Set</span>
                          <span>{(accuracy * 0.85).toFixed(1)}%</span>
                        </div>
                        <Progress value={accuracy * 0.85} className="h-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border">
                  <CardContent className="p-4">
                    <div>
                      <h3 className="text-base font-semibold mb-1">Loss</h3>
                      <div className="text-3xl font-bold">{(1 - accuracy/100).toFixed(3)}</div>
                      
                      <div className="mt-4 text-sm">
                        <BarChart className="h-4 w-4 mb-1 inline-block" /> Loss curve visualization
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="rounded-md border p-4">
                <h3 className="text-sm font-medium mb-2">Confusion Matrix</h3>
                <div className="grid grid-cols-3 gap-1 text-center text-sm">
                  <div className="p-1 bg-muted"></div>
                  <div className="p-1 bg-muted font-semibold">Predicted +</div>
                  <div className="p-1 bg-muted font-semibold">Predicted -</div>
                  
                  <div className="p-1 bg-muted font-semibold">Actual +</div>
                  <div className="p-1 bg-green-100 dark:bg-green-900/30">85 (TP)</div>
                  <div className="p-1 bg-red-100 dark:bg-red-900/30">15 (FN)</div>
                  
                  <div className="p-1 bg-muted font-semibold">Actual -</div>
                  <div className="p-1 bg-red-100 dark:bg-red-900/30">10 (FP)</div>
                  <div className="p-1 bg-green-100 dark:bg-green-900/30">90 (TN)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NeuralNet;
