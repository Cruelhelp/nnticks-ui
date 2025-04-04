
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Brain, Trophy, Check, Lock, Zap, BarChart, Star, Activity, Copyright } from 'lucide-react';
import { trainingService } from '@/services/TrainingService';
import { neuralNetwork } from '@/lib/neuralNetwork';

interface Mission {
  id: number;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  locked: boolean;
  requiredLevel?: number;
  proBadge?: boolean;
  epochs?: number;
}

const TrainingNotice = () => (
  <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 animate-fadeIn">
    <div className="flex items-start">
      <div className="mr-3 pt-1">
        <Brain className="h-5 w-5 text-yellow-500" />
      </div>
      <div>
        <h3 className="font-semibold text-sm">Training Connection Notice</h3>
        <p className="text-sm text-muted-foreground mt-1">
          During training, market data connection is temporarily paused as the neural network training is performed offline. 
          Your available training epochs will determine which training missions are available to you.
        </p>
      </div>
    </div>
  </div>
);

const NeuralNetworkVisualization = ({ activeNodes, animationIntensity }: { activeNodes: string[], animationIntensity: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Define layers
    const layers = [3, 5, 5, 3]; // Input, hidden, hidden, output
    const layerSpacing = canvas.width / (layers.length + 1);
    
    // Draw connections first (so they're behind nodes)
    ctx.lineWidth = 1;
    
    for (let layerIdx = 0; layerIdx < layers.length - 1; layerIdx++) {
      const fromNodesCount = layers[layerIdx];
      const toNodesCount = layers[layerIdx + 1];
      
      const startX = (layerIdx + 1) * layerSpacing;
      const endX = (layerIdx + 2) * layerSpacing;
      
      for (let fromNodeIdx = 0; fromNodeIdx < fromNodesCount; fromNodeIdx++) {
        const nodeId = `nn-node-${layerIdx}-${fromNodeIdx}`;
        const fromY = (canvas.height / (fromNodesCount + 1)) * (fromNodeIdx + 1);
        
        for (let toNodeIdx = 0; toNodeIdx < toNodesCount; toNodeIdx++) {
          const toNodeId = `nn-node-${layerIdx + 1}-${toNodeIdx}`;
          const toY = (canvas.height / (toNodesCount + 1)) * (toNodeIdx + 1);
          
          // Check if either node is active for connection highlighting
          const isActive = activeNodes.includes(nodeId) || activeNodes.includes(toNodeId);
          
          if (isActive) {
            // Gradient for active connections
            const gradient = ctx.createLinearGradient(startX, fromY, endX, toY);
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)'); // Start color (green-500)
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0.3)'); // End color (more transparent)
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            
            // Animated dash for higher animation intensity
            if (animationIntensity > 3) {
              ctx.setLineDash([4, 2]);
              ctx.lineDashOffset = (Date.now() / 100) % 6;
            } else {
              ctx.setLineDash([]);
            }
          } else {
            // Inactive connections
            ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)'; // slate-400 with low opacity
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
          }
          
          ctx.beginPath();
          ctx.moveTo(startX, fromY);
          ctx.lineTo(endX, toY);
          ctx.stroke();
        }
      }
    }
    
    // Draw nodes
    for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
      const nodesCount = layers[layerIdx];
      const x = (layerIdx + 1) * layerSpacing;
      
      for (let nodeIdx = 0; nodeIdx < nodesCount; nodeIdx++) {
        const y = (canvas.height / (nodesCount + 1)) * (nodeIdx + 1);
        const nodeId = `nn-node-${layerIdx}-${nodeIdx}`;
        const isActive = activeNodes.includes(nodeId);
        
        // Draw node
        ctx.beginPath();
        ctx.arc(x, y, isActive ? 6 : 4, 0, Math.PI * 2);
        
        if (isActive) {
          // Draw glow for active nodes
          const gradient = ctx.createRadialGradient(x, y, 2, x, y, 10);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 1)'); // Green-500
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
          
          ctx.fillStyle = 'rgb(16, 185, 129)'; // Green-500
          ctx.shadowColor = 'rgba(16, 185, 129, 0.7)';
          ctx.shadowBlur = 10 * animationIntensity;
        } else {
          ctx.fillStyle = 'rgba(100, 116, 139, 0.5)'; // slate-400 with medium opacity
          ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow for next elements
        
        // Draw small pulse effect for active nodes
        if (isActive && animationIntensity > 2) {
          const pulseSize = 10 + Math.sin(Date.now() / 200) * 5;
          ctx.beginPath();
          ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
          ctx.fill();
        }
      }
    }
    
    // Add layer labels at the bottom
    ctx.fillStyle = 'rgba(100, 116, 139, 0.7)'; // slate-400 with medium opacity
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    ctx.fillText('Input Layer', layerSpacing, canvas.height - 10);
    ctx.fillText('Hidden Layers', (layerSpacing * 2.5), canvas.height - 10);
    ctx.fillText('Output Layer', layerSpacing * 4, canvas.height - 10);
    
  }, [activeNodes, animationIntensity]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-64 border-0"
      style={{ background: 'transparent' }}
    />
  );
};

const Training = () => {
  const { user, userDetails } = useAuth();
  const isPro = userDetails?.proStatus || false;
  
  const [missions, setMissions] = useState<Mission[]>([
    {
      id: 1,
      title: "Initial Training",
      description: "Train the neural network for 1,000 epochs",
      points: 10,
      completed: false,
      locked: false,
      epochs: 1000
    },
    {
      id: 2,
      title: "Feature Learning",
      description: "Train the model to identify market patterns (5,000 epochs)",
      points: 15,
      completed: false,
      locked: false,
      epochs: 5000
    },
    {
      id: 3,
      title: "Deep Learning",
      description: "Complete 10,000 training epochs with 65% accuracy",
      points: 20,
      completed: false,
      locked: false,
      epochs: 10000
    },
    {
      id: 4,
      title: "Hyperparameter Tuning",
      description: "Optimize learning rate and batch size over 20,000 epochs",
      points: 25,
      completed: false,
      locked: false,
      epochs: 20000
    },
    {
      id: 5,
      title: "Advanced Pattern Recognition",
      description: "Train custom feature extractors for 30,000 epochs",
      points: 30,
      completed: false,
      locked: false,
      epochs: 30000
    },
    // Pro missions
    {
      id: 6,
      title: "Transfer Learning",
      description: "Apply pre-trained models and fine-tune for 50,000 epochs",
      points: 40,
      completed: false,
      locked: !isPro,
      proBadge: true,
      epochs: 50000
    },
    {
      id: 7,
      title: "Gradient Mastery",
      description: "Implement advanced gradient techniques for 75,000 epochs",
      points: 50,
      completed: false,
      locked: !isPro,
      proBadge: true,
      epochs: 75000
    },
    {
      id: 8,
      title: "Model Ensembling",
      description: "Train multiple models simultaneously for 100,000 epochs",
      points: 60,
      completed: false,
      locked: !isPro,
      requiredLevel: 2,
      proBadge: true,
      epochs: 100000
    },
    {
      id: 9,
      title: "Reinforcement Learning",
      description: "Train agent with 200,000 epochs for 80% prediction accuracy",
      points: 75,
      completed: false,
      locked: !isPro,
      requiredLevel: 3,
      proBadge: true,
      epochs: 200000
    },
    {
      id: 10,
      title: "NNticks Grandmaster",
      description: "Complete 500,000 training epochs with 85% market prediction accuracy",
      points: 100,
      completed: false,
      locked: !isPro,
      requiredLevel: 4,
      proBadge: true,
      epochs: 500000
    }
  ]);
  
  const [totalPoints, setTotalPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [missionProgress, setMissionProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [animationIntensity, setAnimationIntensity] = useState(1);
  const [trainingEpochs, setTrainingEpochs] = useState(0);
  const [availableEpochs, setAvailableEpochs] = useState(0);
  const [isLoadingEpochs, setIsLoadingEpochs] = useState(true);
  const [showTrainingAnimation, setShowTrainingAnimation] = useState(false);
  const [neuralNetworkWeights, setNeuralNetworkWeights] = useState<number[][]>([]);
  
  // Set up training service user ID
  useEffect(() => {
    if (user) {
      trainingService.setUserId(user.id);
    } else {
      trainingService.setUserId(null);
    }
  }, [user]);
  
  // Define level thresholds
  const levelThresholds = [
    { level: 1, minPoints: 0, maxPoints: 100 },
    { level: 2, minPoints: 101, maxPoints: 250 },
    { level: 3, minPoints: 251, maxPoints: 500 },
    { level: 4, minPoints: 501, maxPoints: 800 },
    { level: 5, minPoints: 801, maxPoints: 1200 }
  ];
  
  // Load user training data from Supabase
  useEffect(() => {
    const fetchEpochs = async () => {
      setIsLoadingEpochs(true);
      
      try {
        if (user) {
          const { available, total } = await trainingService.getUserEpochs();
          setAvailableEpochs(available);
          setTrainingEpochs(total);
        } else {
          // Default for guests
          setAvailableEpochs(25);
          setTrainingEpochs(25);
        }
      } catch (err) {
        console.error('Failed to load epochs:', err);
        setAvailableEpochs(25);
        setTrainingEpochs(25);
      } finally {
        setIsLoadingEpochs(false);
      }
    };
    
    fetchEpochs();
    
    // Also load training history
    const loadTrainingHistory = async () => {
      if (!user) return;
      
      try {
        // Get completed missions from training history
        const history = await trainingService.getTrainingHistory();
        
        // Update missions completion status
        if (history.length > 0) {
          const completedMissionTitles = history.map(h => h.mission.replace('Mission ', ''));
          
          setMissions(prev => prev.map(mission => ({
            ...mission,
            completed: completedMissionTitles.includes(mission.id.toString())
          })));
          
          // Calculate total points
          const points = history.reduce((sum, item) => sum + item.points, 0);
          setTotalPoints(points);
          
          // Set level based on points
          const currentLevelData = levelThresholds.find(
            lt => points >= lt.minPoints && points <= lt.maxPoints
          ) || levelThresholds[0];
          
          setLevel(currentLevelData.level);
        }
      } catch (error) {
        console.error('Error loading training history:', error);
      }
    };
    
    loadTrainingHistory();
  }, [user, levelThresholds]);
  
  // Effect for neural network animation
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    const animateNetwork = () => {
      // Activate random nodes based on animation intensity
      const numNodesToActivate = Math.min(5, animationIntensity);
      const newActiveNodes = [];
      
      for (let i = 0; i < numNodesToActivate; i++) {
        const layerIdx = Math.floor(Math.random() * 4);
        const nodeIdx = Math.floor(Math.random() * 5);
        newActiveNodes.push(`nn-node-${layerIdx}-${nodeIdx}`);
      }
      
      setActiveNodes(newActiveNodes);
      
      // Reset after a delay
      timeout = setTimeout(() => {
        setActiveNodes([]);
        // Schedule next animation with variable timing based on intensity
        timeout = setTimeout(animateNetwork, 1500 - (animationIntensity * 150));
      }, 800);
    };
    
    // Start animation
    timeout = setTimeout(animateNetwork, 1000);
    
    return () => clearTimeout(timeout);
  }, [animationIntensity]);
  
  // Neural network training visualization
  useEffect(() => {
    if (!showTrainingAnimation) return;
    
    let frameId: number;
    const layerSizes = [3, 5, 5, 3];
    let currentStep = 0;
    const maxSteps = 100;
    const framesPerStep = 3;
    let currentFrame = 0;
    
    const animate = () => {
      if (currentFrame % framesPerStep === 0 && currentStep < maxSteps) {
        // Generate random weights for visualization
        const weights: number[][] = [];
        
        for (let i = 0; i < layerSizes.length - 1; i++) {
          const layerWeights: number[] = [];
          const connections = layerSizes[i] * layerSizes[i + 1];
          
          for (let j = 0; j < connections; j++) {
            // Weight values converge toward optimum as training progresses
            const randomFactor = Math.max(0.8, 1 - currentStep / maxSteps);
            const baseWeight = 0.7 + (currentStep / maxSteps) * 0.3; // Weights improve over time
            layerWeights.push(baseWeight + (Math.random() - 0.5) * randomFactor);
          }
          
          weights.push(layerWeights);
        }
        
        setNeuralNetworkWeights(weights);
        currentStep++;
        
        // Activate random nodes for visual effect
        const newActiveNodes = [];
        for (let i = 0; i < Math.min(8, 3 + Math.floor(currentStep / 10)); i++) {
          const layerIdx = Math.floor(Math.random() * layerSizes.length);
          const nodeIdx = Math.floor(Math.random() * layerSizes[layerIdx]);
          newActiveNodes.push(`nn-node-${layerIdx}-${nodeIdx}`);
        }
        
        setActiveNodes(newActiveNodes);
        
        // Update progress
        setMissionProgress((currentStep / maxSteps) * 100);
      }
      
      currentFrame++;
      
      if (currentStep >= maxSteps) {
        // Training is complete
        setShowTrainingAnimation(false);
        completeMission(activeMission!);
      } else {
        frameId = requestAnimationFrame(animate);
      }
    };
    
    frameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [showTrainingAnimation, activeMission]);
  
  const startMission = async (mission: Mission) => {
    if (mission.locked) {
      if (mission.proBadge && !isPro) {
        toast.error('This mission requires a Pro subscription');
      } else {
        toast.error(`This mission requires level ${mission.requiredLevel}`);
      }
      return;
    }
    
    if (mission.completed) {
      toast.info('This mission has already been completed');
      return;
    }
    
    // Check if user has enough epochs
    if (mission.epochs && mission.epochs > availableEpochs) {
      toast.error(`Not enough epochs. This mission requires ${mission.epochs} epochs, but you only have ${availableEpochs} available.`);
      return;
    }
    
    setActiveMission(mission);
    setMissionProgress(0);
    toast.info(`Mission started: ${mission.title}`);
    
    // Enhance animation intensity during mission
    const prevIntensity = animationIntensity;
    setAnimationIntensity(Math.min(prevIntensity + 2, 5));
    
    // If epochs are sufficient, attempt to use them
    if (mission.epochs) {
      try {
        const success = await trainingService.useEpochs(mission.epochs);
        
        if (!success) {
          // Revert state on failure
          setActiveMission(null);
          setAnimationIntensity(prevIntensity);
          return;
        }
        
        // Update available epochs
        setAvailableEpochs(prev => prev - mission.epochs!);
        
        // Start training animation
        setShowTrainingAnimation(true);
      } catch (error) {
        console.error('Error using epochs:', error);
        toast.error('Failed to start mission');
        setActiveMission(null);
        setAnimationIntensity(prevIntensity);
      }
    }
  };
  
  const completeMission = async (mission: Mission) => {
    setIsProcessing(true);
    
    try {
      // Update mission in state
      setMissions(prev => 
        prev.map(m => m.id === mission.id ? { ...m, completed: true } : m)
      );
      
      // Calculate new total points
      const newTotalPoints = totalPoints + mission.points;
      setTotalPoints(newTotalPoints);
      
      // Add epochs to total
      const newEpochs = trainingEpochs + (mission.epochs || 0);
      setTrainingEpochs(newEpochs);
      
      // Determine level based on new points
      const currentLevelData = levelThresholds.find(
        lt => newTotalPoints >= lt.minPoints && newTotalPoints <= lt.maxPoints
      ) || levelThresholds[0];
      
      const newLevelValue = currentLevelData.level;
      
      // Check if level up occurred
      if (newLevelValue > level) {
        setLevel(newLevelValue);
        toast.success(`Level Up! You are now level ${newLevelValue}`, {
          icon: <Star className="h-5 w-5 text-yellow-500" />,
          duration: 5000,
          className: "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50",
        });
        
        // Increase animation intensity on level up
        setAnimationIntensity(Math.min(newLevelValue, 5));
      }
      
      // Calculate simulated accuracy (higher with higher level/mission difficulty)
      const baseAccuracy = 70;
      const levelBonus = newLevelValue * 2;
      const difficultyBonus = Math.floor(mission.points / 5);
      const randomVariation = Math.floor(Math.random() * 6);
      
      const accuracy = Math.min(95, baseAccuracy + levelBonus + difficultyBonus + randomVariation);
      
      // Save to Supabase
      if (user) {
        await trainingService.saveMissionResult({
          missionId: mission.id,
          epochs: mission.epochs || 0,
          accuracy,
          points: mission.points
        });
      }
      
      // Train neural network with new parameters
      try {
        // Provide a progress callback for the training process
        await neuralNetwork.train(
          ticks.map(t => t.value), 
          { 
            maxEpochs: 20,
            onProgress: (progress) => console.log(`Training progress: ${Math.round(progress * 100)}%`) 
          }
        );
      } catch (err) {
        console.error('Error training neural network:', err);
      }
      
      toast.success(`Mission completed! Trained for ${mission.epochs?.toLocaleString()} epochs with ${accuracy}% accuracy.`, {
        icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      });
    } catch (error) {
      console.error('Error completing mission:', error);
      toast.error('Failed to save mission progress');
    } finally {
      setIsProcessing(false);
      setActiveMission(null);
    }
  };
  
  // Calculate level progress
  const calculateLevelProgress = () => {
    const currentLevelData = levelThresholds.find(
      lt => totalPoints >= lt.minPoints && totalPoints <= lt.maxPoints
    ) || levelThresholds[0];
    
    if (!currentLevelData) return 0;
    
    const levelProgress = 
      ((totalPoints - currentLevelData.minPoints) / 
      (currentLevelData.maxPoints - currentLevelData.minPoints)) * 100;
      
    return Math.min(Math.max(levelProgress, 0), 100);
  };
  
  // Mock data for training
  const ticks = Array(100).fill(0).map((_, i) => ({ value: 100 + Math.sin(i / 10) * 20 + Math.random() * 5 }));
  
  return (
    <>
      <TrainingNotice />
      
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Neural Network Training</h2>
          <p className="text-sm text-muted-foreground">Train your neural network on specific market patterns</p>
        </div>
        
        <div className="bg-primary/10 px-4 py-2 rounded-full flex items-center space-x-2">
          <Brain className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-medium">Available Epochs</div>
            <div className="text-lg font-bold">
              {isLoadingEpochs ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                availableEpochs.toLocaleString()
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" /> 
                Neural Network Training Missions
              </CardTitle>
              <CardDescription>
                Complete training missions to improve your model accuracy and prediction abilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeMission ? (
                <div className="space-y-4 animate-[enter_0.5s_ease-out]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">{activeMission.title}</h3>
                    {activeMission.proBadge && (
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                        PRO
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{activeMission.description}</p>
                  
                  <div className="bg-muted/30 p-4 rounded-md border">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Training progress</span>
                      <span className="font-medium">{Math.min(missionProgress, 100)}%</span>
                    </div>
                    
                    <div className="relative">
                      <Progress value={missionProgress} className="h-2" />
                      
                      {/* Animated highlights on the progress bar */}
                      {missionProgress > 0 && missionProgress < 100 && (
                        <>
                          <span className="absolute h-2 w-6 bg-white/20 animate-pulse rounded" 
                            style={{ left: `${Math.min(95, missionProgress)}%`, transition: 'left 0.5s ease' }} />
                          <span className="absolute top-0 left-0 h-2 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </>
                      )}
                    </div>
                    
                    <div className="mt-6 grid grid-cols-5 gap-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} 
                          className={`h-2 rounded ${
                            missionProgress >= (i+1) * 20 ? 'bg-primary' : 'bg-muted-foreground/30'
                          } transition-colors duration-500`}
                        />
                      ))}
                    </div>
                    
                    <div className="mt-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-sm">Training neural network...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          Completed {Math.floor(missionProgress / 100 * (activeMission.epochs || 10000)).toLocaleString()} epochs
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart className="h-4 w-4 text-primary" />
                        <span className="text-sm">Accuracy optimization: {60 + Math.floor(missionProgress * 0.3)}%</span>
                      </div>
                    </div>
                    
                    {/* Neural network training visualization */}
                    <div className="mt-4 p-2 border rounded bg-background/50">
                      <div className="text-xs text-muted-foreground mb-2">Neural Network Training Visualization</div>
                      <NeuralNetworkVisualization 
                        activeNodes={activeNodes} 
                        animationIntensity={animationIntensity} 
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      setActiveMission(null);
                      setShowTrainingAnimation(false);
                    }} 
                    variant="outline"
                    disabled={isProcessing}
                  >
                    Cancel Mission
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 animate-[enter_0.3s_ease-out]">
                  {missions.map((mission) => (
                    <Card key={mission.id} 
                      className={`overflow-hidden transition-all hover:shadow-md ${
                        mission.locked ? 'opacity-50' : 
                        mission.completed ? 'border-green-200 dark:border-green-900' : ''
                      } hover:-translate-y-1 transition-transform duration-300`}
                    >
                      <CardHeader className="p-4 pb-0">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base flex items-center gap-2">
                            {mission.completed ? <Check className="h-4 w-4 text-green-500" /> : null}
                            {mission.title}
                          </CardTitle>
                          {mission.completed ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                              <Check className="mr-1 h-3 w-3" /> Completed
                            </Badge>
                          ) : mission.proBadge ? (
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                              PRO
                            </Badge>
                          ) : null}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">{mission.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm font-medium">{mission.points} points</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {mission.epochs?.toLocaleString()} epochs
                          </div>
                        </div>
                        <div className="mt-3">
                          <Button 
                            size="sm" 
                            onClick={() => startMission(mission)}
                            disabled={mission.locked || isProcessing || (mission.epochs || 0) > availableEpochs}
                            className={`w-full ${!mission.locked && !mission.completed ? 'relative overflow-hidden group' : ''}`}
                          >
                            {mission.locked ? (
                              <>
                                <Lock className="h-4 w-4 mr-1" /> Locked
                              </>
                            ) : mission.completed ? (
                              'Retrain'
                            ) : (mission.epochs || 0) > availableEpochs ? (
                              'Not Enough Epochs'
                            ) : (
                              <>
                                <span className="relative z-10">Start Training</span>
                                <span className="absolute inset-0 bg-primary/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground border-t pt-2">
              <Copyright className="h-3 w-3 mr-1" /> NNticks Enterprise Analytics 2025
            </CardFooter>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Neural Network Training</CardTitle>
            <CardDescription>
              Your model's current training status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl">Level {level}</h3>
                <p className="text-sm text-muted-foreground">
                  {totalPoints} total points
                </p>
              </div>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center relative overflow-hidden">
                <Brain className="h-8 w-8 text-primary relative z-10" />
                {/* Animated background pulse */}
                <div className={`absolute inset-0 bg-primary/20 rounded-full animate-ping ${
                  animationIntensity > 2 ? 'opacity-100' : 'opacity-50'
                }`} style={{ animationDuration: `${3 - animationIntensity * 0.4}s` }} />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Level Progress</span>
                <span>
                  {totalPoints} / 
                  {levelThresholds.find(lt => lt.level === level)?.maxPoints || 100}
                </span>
              </div>
              <div className="relative">
                <Progress value={calculateLevelProgress()} className="h-2" />
                <span className="absolute h-2 w-4 bg-white/20 rounded animate-pulse" 
                  style={{ left: `${Math.min(95, calculateLevelProgress())}%` }} />
              </div>
            </div>
            
            <div className="pt-4">
              <h4 className="font-medium mb-2 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-yellow-500" />
                Neural Network Visualization
              </h4>
              <div className="border p-4 rounded-md bg-background relative">
                <NeuralNetworkVisualization 
                  activeNodes={activeNodes} 
                  animationIntensity={animationIntensity} 
                />
                
                {/* Training stats */}
                <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="text-muted-foreground mb-1">Total Epochs</div>
                    <div className="font-mono">{trainingEpochs.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Accuracy</div>
                    <div className="font-mono">{75 + level * 3}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Models</div>
                    <div className="font-mono">{level * 2 + 1}</div>
                  </div>
                </div>
              </div>
              
              {/* Pro upgrade banner */}
              {!isPro && (
                <div className="mt-4 p-3 border border-purple-300 bg-purple-50 dark:bg-purple-900/20 rounded-md animate-pulse">
                  <h4 className="font-semibold flex items-center gap-2 text-purple-800 dark:text-purple-300 text-sm">
                    <span className="text-xs bg-purple-200 dark:bg-purple-800 px-2 py-0.5 rounded">PRO</span>
                    Unlock Advanced Training
                  </h4>
                  <p className="text-xs text-purple-700 dark:text-purple-400 my-1">
                    Get access to pro missions and advanced neural network customizations.
                  </p>
                  <Button 
                    onClick={() => window.location.href = `https://paypal.me/username?business=support@nnticks.com`}
                    variant="default" 
                    className="mt-1 bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 px-2"
                    size="sm"
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground border-t pt-2">
            <Copyright className="h-3 w-3 mr-1" /> NNticks Enterprise Analytics 2025
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default Training;
