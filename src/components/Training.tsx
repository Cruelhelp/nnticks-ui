
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Brain, Trophy, Check, Lock } from 'lucide-react';

interface Mission {
  id: number;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  locked: boolean;
  requiredLevel?: number;
  proBadge?: boolean;
}

const Training = () => {
  const { user, userDetails } = useAuth();
  const isPro = userDetails?.proStatus || false;
  
  const [missions, setMissions] = useState<Mission[]>([
    {
      id: 1,
      title: "First Steps",
      description: "Connect to a broker and analyze 100 ticks",
      points: 10,
      completed: false,
      locked: false
    },
    {
      id: 2,
      title: "Pattern Recognition",
      description: "Identify 3 basic market patterns in a tick stream",
      points: 15,
      completed: false,
      locked: false
    },
    {
      id: 3,
      title: "Prediction Novice",
      description: "Make 10 predictions with at least 50% accuracy",
      points: 20,
      completed: false,
      locked: false
    },
    {
      id: 4,
      title: "Dataset Builder",
      description: "Upload a historical dataset with at least 1,000 ticks",
      points: 25,
      completed: false,
      locked: false
    },
    {
      id: 5,
      title: "RSI Master",
      description: "Successfully use RSI to predict 5 market movements",
      points: 30,
      completed: false,
      locked: false
    },
    // Pro missions
    {
      id: 6,
      title: "Advanced Indicators",
      description: "Use Bollinger Bands to achieve 65% prediction accuracy over 20 trades",
      points: 40,
      completed: false,
      locked: !isPro,
      proBadge: true
    },
    {
      id: 7,
      title: "Neural Expert",
      description: "Customize NN parameters to achieve 70% prediction accuracy",
      points: 50,
      completed: false,
      locked: !isPro,
      proBadge: true
    },
    {
      id: 8,
      title: "Trading Marathon",
      description: "Complete 50 consecutive predictions with no breaks",
      points: 60,
      completed: false,
      locked: !isPro,
      requiredLevel: 2,
      proBadge: true
    },
    {
      id: 9,
      title: "Market Guru",
      description: "Achieve 80% accuracy over 100 trades",
      points: 75,
      completed: false,
      locked: !isPro,
      requiredLevel: 3,
      proBadge: true
    },
    {
      id: 10,
      title: "NNticks Master",
      description: "Create a custom model with 85% accuracy and share it",
      points: 100,
      completed: false,
      locked: !isPro,
      requiredLevel: 4,
      proBadge: true
    }
  ]);
  
  const [totalPoints, setTotalPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [missionProgress, setMissionProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
    if (user) {
      loadTrainingData();
    }
  }, [user]);
  
  const loadTrainingData = async () => {
    try {
      const { data, error } = await supabase
        .from('training_history')
        .select('*')
        .eq('user_id', user?.id);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Calculate total points
        const points = data.reduce((sum, item) => sum + item.points, 0);
        setTotalPoints(points);
        
        // Update missions completed status
        const completedMissions = new Set(data.map(item => item.mission));
        setMissions(prev => prev.map(mission => ({
          ...mission,
          completed: completedMissions.has(mission.title)
        })));
        
        // Calculate level based on points
        const currentLevelData = levelThresholds.find(
          lt => points >= lt.minPoints && points <= lt.maxPoints
        ) || levelThresholds[0];
        
        setLevel(currentLevelData.level);
      }
    } catch (error) {
      console.error('Error loading training data:', error);
    }
  };
  
  const startMission = (mission: Mission) => {
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
    
    setActiveMission(mission);
    setMissionProgress(0);
    toast.info(`Mission started: ${mission.title}`);
    
    // Simulate mission progress
    const interval = setInterval(() => {
      setMissionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          completeMission(mission);
          return 100;
        }
        return prev + Math.floor(Math.random() * 5) + 1;
      });
    }, 500);
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
      
      // Determine level based on new points
      const currentLevelData = levelThresholds.find(
        lt => newTotalPoints >= lt.minPoints && newTotalPoints <= lt.maxPoints
      ) || levelThresholds[0];
      
      const newLevel = currentLevelData.level;
      
      // Check if level up occurred
      if (newLevel > level) {
        setLevel(newLevel);
        toast.success(`Level Up! You are now level ${newLevel}`);
      }
      
      // Save to Supabase
      if (user) {
        const { error } = await supabase
          .from('training_history')
          .insert({
            user_id: user.id,
            mission: mission.title,
            date: new Date().toISOString(),
            points: mission.points,
            accuracy: 70 + Math.floor(Math.random() * 15) // Simulated accuracy between 70-85%
          });
          
        if (error) throw error;
      }
      
      // Update leaderboard
      if (user) {
        const { error } = await supabase
          .from('leaderboard')
          .upsert({
            user_id: user.id,
            username: userDetails?.username || 'Anonymous',
            accuracy: 75 + Math.floor(Math.random() * 10),
            level: newLevel
          });
          
        if (error) throw error;
      }
      
      toast.success(`Mission completed! Earned ${mission.points} points.`);
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
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="md:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Training Missions</CardTitle>
            <CardDescription>
              Complete missions to improve your neural network and earn points
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeMission ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{activeMission.title}</h3>
                <p className="text-sm text-muted-foreground">{activeMission.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.min(missionProgress, 100)}%</span>
                  </div>
                  <Progress value={missionProgress} className="h-2" />
                </div>
                <Button 
                  onClick={() => setActiveMission(null)} 
                  variant="outline"
                  disabled={isProcessing}
                >
                  Cancel Mission
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {missions.map((mission) => (
                  <Card key={mission.id} className={`overflow-hidden transition-all ${mission.locked ? 'opacity-50' : ''}`}>
                    <CardHeader className="p-4 pb-0">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">
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
                        <Button 
                          size="sm" 
                          onClick={() => startMission(mission)}
                          disabled={mission.locked || mission.completed}
                        >
                          {mission.locked ? (
                            <>
                              <Lock className="h-4 w-4 mr-1" /> Locked
                            </>
                          ) : mission.completed ? (
                            'Replay'
                          ) : (
                            'Start'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Neural Network Training</CardTitle>
          <CardDescription>
            Your bot's current training status
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
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="h-8 w-8 text-primary" />
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
            <Progress value={calculateLevelProgress()} className="h-2" />
          </div>
          
          <div className="pt-4">
            <h4 className="font-medium mb-2">Neural Network Visualization</h4>
            <div className="border p-4 rounded-md bg-background relative">
              {/* Neural network visualization */}
              <div className="relative h-64 overflow-hidden">
                {Array.from({ length: 4 }).map((_, layerIdx) => (
                  <div 
                    key={`layer-${layerIdx}`} 
                    className="absolute top-0 bottom-0 flex flex-col justify-around"
                    style={{ left: `${20 + layerIdx * 20}%`, width: '10%' }}
                  >
                    {Array.from({ length: layerIdx === 0 || layerIdx === 3 ? 3 : 5 }).map((_, nodeIdx) => (
                      <div key={`node-${layerIdx}-${nodeIdx}`} className="flex justify-center">
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            Math.random() > 0.7 ? 'bg-primary animate-pulse' : 'bg-muted-foreground'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                ))}
                
                <svg className="absolute top-0 left-0 w-full h-full">
                  {Array.from({ length: 3 }).map((_, layerIdx) => (
                    Array.from({ length: layerIdx === 0 ? 3 : 5 }).map((_, fromIdx) => (
                      Array.from({ length: layerIdx === 2 ? 3 : 5 }).map((_, toIdx) => (
                        <line
                          key={`line-${layerIdx}-${fromIdx}-${toIdx}`}
                          x1={`${25 + layerIdx * 20}%`}
                          y1={`${layerIdx === 0 
                            ? (fromIdx + 1) * 25 
                            : ((fromIdx + 1) * 100) / 6}%`}
                          x2={`${25 + (layerIdx + 1) * 20}%`}
                          y2={`${layerIdx === 2 
                            ? (toIdx + 1) * 25 
                            : ((toIdx + 1) * 100) / 6}%`}
                          stroke="currentColor"
                          strokeOpacity={Math.random() > 0.7 ? 0.8 : 0.2}
                          strokeWidth={Math.random() > 0.7 ? 2 : 1}
                          className={Math.random() > 0.7 ? 'text-primary' : 'text-muted-foreground'}
                        />
                      ))
                    ))
                  ).flat(2)}
                </svg>
              </div>
              
              <div className="text-xs text-muted-foreground mt-2">
                <div className="flex justify-between">
                  <span>Input Layer</span>
                  <span>Hidden Layers</span>
                  <span>Output Layer</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Training;
