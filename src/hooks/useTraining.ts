import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { neuralNetwork, NNConfiguration } from '@/lib/neuralNetwork';
import { trainingService, TrainingMission, TrainingResult, TrainingHistoryItem } from '@/services/TrainingService';
import { useTicks } from '@/hooks/useTicks';
import { toast } from 'sonner';

export function useTraining() {
  const { user, userDetails } = useAuth();
  const { ticks } = useTicks({ maxTicks: 200 });
  
  const [missions, setMissions] = useState<TrainingMission[]>([]);
  const [level, setLevel] = useState(1);
  const [activeMission, setActiveMission] = useState<TrainingMission | null>(null);
  const [progress, setProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [animationIntensity, setAnimationIntensity] = useState(1);
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistoryItem[]>([]);
  const [availableEpochs, setAvailableEpochs] = useState(0);
  const [totalEpochs, setTotalEpochs] = useState(0);
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [isLoadingEpochs, setIsLoadingEpochs] = useState(true);
  const isPro = userDetails?.proStatus || false;
  
  // Set user ID in training service
  useEffect(() => {
    if (user) {
      trainingService.setUserId(user.id);
    } else {
      trainingService.setUserId(null);
    }
  }, [user]);
  
  // Load user epochs and level
  const loadUserData = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingEpochs(true);
    
    try {
      // Get user epochs
      const { available, total } = await trainingService.getUserEpochs();
      setAvailableEpochs(available);
      setTotalEpochs(total);
      
      // Get user level
      const userLevel = await trainingService.getLevel();
      setLevel(userLevel);
      
      // Get training history
      const history = await trainingService.getTrainingHistory();
      setTrainingHistory(history);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingEpochs(false);
    }
  }, [user]);
  
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);
  
  // Initialize missions based on user level and pro status
  useEffect(() => {
    // Define the missions
    const missionsList: TrainingMission[] = [
      {
        id: 1,
        title: "Initial Training",
        description: "Train the neural network for 50 epochs",
        points: 10,
        completed: false,
        locked: false,
        epochs: 50
      },
      {
        id: 2,
        title: "Pattern Recognition",
        description: "Train the model to identify market patterns (100 epochs)",
        points: 15,
        completed: false,
        locked: false,
        epochs: 100
      },
      {
        id: 3,
        title: "Basic Learning",
        description: "Complete 500 training epochs with 65% accuracy",
        points: 20,
        completed: false,
        locked: level < 1,
        epochs: 500
      },
      {
        id: 4,
        title: "Intermediate Analysis",
        description: "Optimize learning parameters over 1,000 epochs",
        points: 25,
        completed: false,
        locked: level < 1,
        epochs: 1000
      },
      {
        id: 5,
        title: "Advanced Pattern Recognition",
        description: "Train custom feature extractors for 5,000 epochs",
        points: 30,
        completed: false,
        locked: level < 2,
        epochs: 5000
      },
      // Pro missions
      {
        id: 6,
        title: "Transfer Learning",
        description: "Apply pre-trained models and fine-tune for 10,000 epochs",
        points: 40,
        completed: false,
        locked: !isPro || level < 2,
        proBadge: true,
        epochs: 10000
      },
      {
        id: 7,
        title: "Gradient Mastery",
        description: "Implement advanced gradient techniques for 20,000 epochs",
        points: 50,
        completed: false,
        locked: !isPro || level < 3,
        proBadge: true,
        epochs: 20000
      },
      {
        id: 8,
        title: "Model Ensembling",
        description: "Train multiple models simultaneously for 50,000 epochs",
        points: 60,
        completed: false,
        locked: !isPro || level < 3,
        requiredLevel: 3,
        proBadge: true,
        epochs: 50000
      },
      {
        id: 9,
        title: "Reinforcement Learning",
        description: "Train agent with 100,000 epochs for 80% prediction accuracy",
        points: 75,
        completed: false,
        locked: !isPro || level < 4,
        requiredLevel: 4,
        proBadge: true,
        epochs: 100000
      },
      {
        id: 10,
        title: "NNticks Grandmaster",
        description: "Complete 250,000 training epochs with 85% market prediction accuracy",
        points: 100,
        completed: false,
        locked: !isPro || level < 4,
        requiredLevel: 4,
        proBadge: true,
        epochs: 250000
      }
    ];
    
    // Mark missions as completed if they exist in training history
    if (trainingHistory.length > 0) {
      trainingHistory.forEach(item => {
        const missionId = parseInt(item.mission.replace('Mission ', ''));
        if (!isNaN(missionId)) {
          const missionIndex = missionsList.findIndex(m => m.id === missionId);
          if (missionIndex !== -1) {
            missionsList[missionIndex].completed = true;
          }
        }
      });
    }
    
    setMissions(missionsList);
  }, [level, isPro, trainingHistory]);
  
  // Handle neural network animation
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
  
  const startMission = async (mission: TrainingMission) => {
    if (mission.locked) {
      if (mission.proBadge && !isPro) {
        toast.error('This mission requires a Pro subscription');
      } else {
        toast.error(`This mission requires level ${mission.requiredLevel || level + 1}`);
      }
      return;
    }
    
    if (availableEpochs < mission.epochs) {
      toast.error(`Not enough epochs. You need ${mission.epochs} but have ${availableEpochs}`);
      return;
    }
    
    if (mission.completed) {
      toast.info('This mission has already been completed, but you can retrain the model');
    }
    
    if (ticks.length < 50) {
      toast.error('Not enough market data for training. Please connect to market data source.');
      return;
    }
    
    setActiveMission(mission);
    setProgress(0);
    setIsTraining(true);
    toast.info(`Mission started: ${mission.title}`);
    
    // Enhance animation intensity during mission
    const prevIntensity = animationIntensity;
    setAnimationIntensity(Math.min(prevIntensity + 2, 5));
    
    try {
      // Use epochs from the user's account
      const epochsUsed = await trainingService.useEpochs(mission.epochs);
      
      if (!epochsUsed) {
        setIsTraining(false);
        setActiveMission(null);
        setAnimationIntensity(prevIntensity);
        return;
      }
      
      // Get tick data for training
      const values = ticks.map(t => t.value);
      
      // Configure neural network
      const config: NNConfiguration = {
        learningRate: 0.01,
        epochs: mission.epochs,
        layers: [64, 32, 2],
        activationFunction: 'relu'
      };
      
      neuralNetwork.updateConfig(config);
      
      // Train neural network with actual data
      const accuracy = await neuralNetwork.train(values, {
        maxEpochs: mission.epochs,
        onProgress: (progress) => {
          setProgress(progress * 100);
        }
      });
      
      // Save training result
      const modelData = neuralNetwork.exportModel();
      
      const trainingResult: TrainingResult = {
        missionId: mission.id,
        epochs: mission.epochs,
        accuracy,
        points: mission.points,
        modelData
      };
      
      await trainingService.saveMissionResult(trainingResult);
      
      // Update available epochs display
      setAvailableEpochs(prev => prev - mission.epochs);
      
      // Update missions list
      setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, completed: true } : m));
      
      // Get updated user data
      await loadUserData();
      
      toast.success(`Mission completed! Trained for ${mission.epochs.toLocaleString()} epochs with ${Math.round(accuracy * 100)}% accuracy.`);
    } catch (error) {
      console.error('Error training model:', error);
      toast.error('Failed to train model');
      
      // Refund epochs on failure
      await trainingService.addEpochs(mission.epochs);
    } finally {
      setIsTraining(false);
      setActiveMission(null);
      setAnimationIntensity(prevIntensity);
    }
  };
  
  return {
    missions,
    level,
    activeMission,
    progress,
    isTraining,
    animationIntensity,
    trainingHistory,
    availableEpochs,
    totalEpochs,
    activeNodes,
    isLoadingEpochs,
    startMission,
    loadUserData
  };
}
