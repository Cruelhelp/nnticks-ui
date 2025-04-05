
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { SimulationState } from '@/types/chartTypes';
import { Play, Pause, FastForward, Clock } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

const LOCAL_STORAGE_KEY = 'neuralNetworkSimulation';

const NeuralNetworkSimulation: React.FC = () => {
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isActive: false,
    speed: 'normal',
    tickCount: 0,
    epochCount: 0,
    lastUpdated: Date.now()
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const neuronPositions = useRef<Array<{x: number, y: number, type: string}>>([]);
  const connections = useRef<Array<{from: number, to: number, weight: number}>>([]);
  const currentSignalPaths = useRef<Array<{fromIdx: number, toIdx: number, progress: number}>>([]);
  
  const { isConnected } = useWebSocket();
  
  // Initialize the simulation
  useEffect(() => {
    // Try to load state from localStorage
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const parsedState: SimulationState = JSON.parse(savedState);
        setSimulationState(parsedState);
      }
    } catch (error) {
      console.error('Error loading simulation state:', error);
    }
    
    // Set up the canvas and network architecture
    setupNetwork();
    
    // Start drawing
    startDrawing();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Effect to handle simulation state changes
  useEffect(() => {
    // Save state to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      ...simulationState,
      lastUpdated: Date.now()
    }));
    
    // Handle simulation speed
    let tickInterval: NodeJS.Timeout | null = null;
    
    if (simulationState.isActive) {
      const intervalTime = 
        simulationState.speed === 'slow' ? 1000 : 
        simulationState.speed === 'normal' ? 500 : 
        200; // fast
      
      tickInterval = setInterval(() => {
        simulateTick();
      }, intervalTime);
    }
    
    return () => {
      if (tickInterval) {
        clearInterval(tickInterval);
      }
    };
  }, [simulationState.isActive, simulationState.speed]);
  
  // Set up the neural network architecture
  const setupNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Clear existing positions
    neuronPositions.current = [];
    connections.current = [];
    
    // Define layers
    const inputLayerSize = 8;
    const hiddenLayer1Size = 12;
    const hiddenLayer2Size = 8;
    const outputLayerSize = 4;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Calculate positions for each layer
    const layerSpacing = width / 5;
    const inputX = layerSpacing;
    const hidden1X = layerSpacing * 2;
    const hidden2X = layerSpacing * 3;
    const outputX = layerSpacing * 4;
    
    // Input layer
    for (let i = 0; i < inputLayerSize; i++) {
      const y = height / (inputLayerSize + 1) * (i + 1);
      neuronPositions.current.push({ x: inputX, y, type: 'input' });
    }
    
    // Hidden layer 1
    for (let i = 0; i < hiddenLayer1Size; i++) {
      const y = height / (hiddenLayer1Size + 1) * (i + 1);
      neuronPositions.current.push({ x: hidden1X, y, type: 'hidden' });
    }
    
    // Hidden layer 2
    for (let i = 0; i < hiddenLayer2Size; i++) {
      const y = height / (hiddenLayer2Size + 1) * (i + 1);
      neuronPositions.current.push({ x: hidden2X, y, type: 'hidden' });
    }
    
    // Output layer
    for (let i = 0; i < outputLayerSize; i++) {
      const y = height / (outputLayerSize + 1) * (i + 1);
      neuronPositions.current.push({ x: outputX, y, type: 'output' });
    }
    
    // Create connections
    // Input to hidden1
    for (let i = 0; i < inputLayerSize; i++) {
      for (let j = 0; j < hiddenLayer1Size; j++) {
        connections.current.push({
          from: i,
          to: inputLayerSize + j,
          weight: Math.random() * 2 - 1 // Random weight between -1 and 1
        });
      }
    }
    
    // Hidden1 to hidden2
    for (let i = 0; i < hiddenLayer1Size; i++) {
      for (let j = 0; j < hiddenLayer2Size; j++) {
        connections.current.push({
          from: inputLayerSize + i,
          to: inputLayerSize + hiddenLayer1Size + j,
          weight: Math.random() * 2 - 1
        });
      }
    }
    
    // Hidden2 to output
    for (let i = 0; i < hiddenLayer2Size; i++) {
      for (let j = 0; j < outputLayerSize; j++) {
        connections.current.push({
          from: inputLayerSize + hiddenLayer1Size + i,
          to: inputLayerSize + hiddenLayer1Size + hiddenLayer2Size + j,
          weight: Math.random() * 2 - 1
        });
      }
    }
  };
  
  // Start the drawing loop
  const startDrawing = () => {
    if (!canvasRef.current) return;
    
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections
      for (const conn of connections.current) {
        const from = neuronPositions.current[conn.from];
        const to = neuronPositions.current[conn.to];
        
        // Determine connection color based on weight
        const weightColor = conn.weight > 0 
          ? `rgba(0, 128, 255, ${Math.abs(conn.weight) * 0.7})`
          : `rgba(255, 128, 0, ${Math.abs(conn.weight) * 0.7})`;
        
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = weightColor;
        ctx.lineWidth = Math.abs(conn.weight) * 2;
        ctx.stroke();
      }
      
      // Draw signal paths (animated)
      for (let i = 0; i < currentSignalPaths.current.length; i++) {
        const signal = currentSignalPaths.current[i];
        const from = neuronPositions.current[signal.fromIdx];
        const to = neuronPositions.current[signal.toIdx];
        
        // Calculate current position based on progress
        const currentX = from.x + (to.x - from.x) * signal.progress;
        const currentY = from.y + (to.y - from.y) * signal.progress;
        
        // Draw signal
        ctx.beginPath();
        ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        
        // Update progress
        signal.progress += 0.03;
        
        // Remove signals that have reached their target
        if (signal.progress >= 1) {
          currentSignalPaths.current.splice(i, 1);
          i--;
          
          // Activate the target neuron
          setTimeout(() => {
            activateNeuron(signal.toIdx);
          }, 50);
        }
      }
      
      // Draw neurons
      for (let i = 0; i < neuronPositions.current.length; i++) {
        const neuron = neuronPositions.current[i];
        
        // Neuron color based on type
        let neuronColor = '#666';
        if (neuron.type === 'input') neuronColor = '#4CAF50';
        else if (neuron.type === 'output') neuronColor = '#FFC107';
        
        // Draw neuron
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = neuronColor;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    animationRef.current = requestAnimationFrame(draw);
  };
  
  // Simulate a tick and update the network
  const simulateTick = () => {
    // Add a tick
    setSimulationState(prev => ({
      ...prev, 
      tickCount: prev.tickCount + 1
    }));
    
    // Every ~100 ticks, complete an epoch
    if (simulationState.tickCount > 0 && simulationState.tickCount % 100 === 0) {
      setSimulationState(prev => ({
        ...prev,
        epochCount: prev.epochCount + 1
      }));
      
      // Simulate learning by adjusting weights
      adjustWeights();
    }
    
    // Trigger an input neuron activation
    const inputIndex = Math.floor(Math.random() * 8);
    activateNeuron(inputIndex);
  };
  
  // Activate a neuron and propagate signals
  const activateNeuron = (neuronIndex: number) => {
    // Find connected neurons and propagate signals
    const connectedNeurons = connections.current.filter(conn => conn.from === neuronIndex);
    
    // Add signal paths for animation
    for (const conn of connectedNeurons) {
      // Only propagate with certain probability to reduce visual noise
      if (Math.random() > 0.3) {
        currentSignalPaths.current.push({
          fromIdx: conn.from,
          toIdx: conn.to,
          progress: 0
        });
      }
    }
  };
  
  // Adjust weights to simulate learning
  const adjustWeights = () => {
    // Update some weights randomly to simulate learning
    const numConnections = connections.current.length;
    const connectionsToUpdate = Math.floor(numConnections * 0.3); // Update 30% of connections
    
    for (let i = 0; i < connectionsToUpdate; i++) {
      const connectionIndex = Math.floor(Math.random() * numConnections);
      const currentWeight = connections.current[connectionIndex].weight;
      
      // Small random adjustment
      const adjustment = (Math.random() * 0.4 - 0.2);
      connections.current[connectionIndex].weight = Math.max(-1, Math.min(1, currentWeight + adjustment));
    }
  };
  
  // Toggle simulation
  const toggleSimulation = () => {
    setSimulationState(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  };
  
  // Set simulation speed
  const setSpeed = (speed: 'slow' | 'normal' | 'fast') => {
    setSimulationState(prev => ({
      ...prev,
      speed
    }));
  };
  
  // Reset simulation
  const resetSimulation = () => {
    if (window.confirm('Reset simulation counters?')) {
      setSimulationState(prev => ({
        ...prev,
        tickCount: 0,
        epochCount: 0
      }));
    }
  };
  
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Neural Network Simulation</CardTitle>
          <div className="flex gap-2">
            <Badge variant={isConnected ? "success" : "destructive"}>
              {isConnected ? "Online" : "Offline"}
            </Badge>
            <Badge variant="outline">
              {simulationState.speed} speed
            </Badge>
          </div>
        </div>
        <CardDescription>
          Visual representation of neural network training
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Simulation Metrics</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              Ticks: {simulationState.tickCount}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Epochs: {simulationState.epochCount}
            </Badge>
          </div>
        </div>
        
        <div className="w-full h-60 border rounded-md bg-black/50 overflow-hidden">
          <canvas 
            ref={canvasRef} 
            className="w-full h-full"
            width={600}
            height={240}
          ></canvas>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">Speed:</span>
            <div className="flex-1">
              <Slider
                defaultValue={[1]}
                min={0}
                max={2}
                step={1}
                onValueChange={(value) => {
                  const speedMap = ['slow', 'normal', 'fast'] as const;
                  setSpeed(speedMap[value[0]]);
                }}
              />
            </div>
            <span className="text-sm capitalize">{simulationState.speed}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 border-t">
        <Button 
          variant="outline" 
          size="sm"
          onClick={resetSimulation}
        >
          Reset Counters
        </Button>
        
        <Button 
          variant={simulationState.isActive ? "secondary" : "default"}
          size="sm"
          onClick={toggleSimulation}
        >
          {simulationState.isActive ? (
            <>
              <Pause className="h-4 w-4 mr-1.5" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1.5" />
              Start
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NeuralNetworkSimulation;
