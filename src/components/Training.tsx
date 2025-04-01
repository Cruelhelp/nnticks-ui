
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Brain, Trophy, Check, Lock, Zap, BarChart, Star, Activity } from 'lucide-react';

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
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [animationIntensity, setAnimationIntensity] = useState(1);
  
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
        
        // Set animation intensity based on level
        setAnimationIntensity(Math.min(currentLevelData.level, 5));
      }
    } catch (error) {
      console.error('Error loading training data:', error);
    }
  };
  
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
    
    // Enhance animation intensity during mission
    const prevIntensity = animationIntensity;
    setAnimationIntensity(Math.min(prevIntensity + 2, 5));
    
    // Simulate mission progress with more dynamic animation
    const interval = setInterval(() => {
      setMissionProgress(prev => {
        // Make progress more unpredictable
        const increment = Math.floor(Math.random() * 8) + 1;
        
        if (prev + increment >= 100) {
          clearInterval(interval);
          // Reset animation intensity after mission
          setTimeout(() => setAnimationIntensity(prevIntensity), 2000);
          
          completeMission(mission);
          return 100;
        }
        return prev + increment;
      });
    }, 400);
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
            level: newLevelValue
          });
          
        if (error) throw error;
      }
      
      toast.success(`Mission completed! Earned ${mission.points} points.`, {
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
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="md:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" /> 
              Training Missions
            </CardTitle>
            <CardDescription>
              Complete missions to improve your neural network and earn points
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
                      <span className="text-sm">Neural network optimization in progress...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-sm">Training weights and biases</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart className="h-4 w-4 text-primary" />
                      <span className="text-sm">Accuracy optimization: {60 + Math.floor(missionProgress * 0.3)}%</span>
                    </div>
                  </div>
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
                        <Button 
                          size="sm" 
                          onClick={() => startMission(mission)}
                          disabled={mission.locked || isProcessing}
                          className={`${!mission.locked && !mission.completed ? 'relative overflow-hidden group' : ''}`}
                        >
                          {mission.locked ? (
                            <>
                              <Lock className="h-4 w-4 mr-1" /> Locked
                            </>
                          ) : mission.completed ? (
                            'Replay'
                          ) : (
                            <>
                              <span className="relative z-10">Start</span>
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
              {/* Neural network visualization with enhanced animation */}
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
                          id={`nn-node-${layerIdx}-${nodeIdx}`}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            activeNodes.includes(`nn-node-${layerIdx}-${nodeIdx}`) 
                              ? 'bg-primary scale-125 animate-pulse shadow-lg shadow-primary/50' 
                              : 'bg-muted-foreground/50'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                ))}
                
                {/* Neural network connections with dynamic animation */}
                <svg className="absolute top-0 left-0 w-full h-full">
                  {Array.from({ length: 3 }).map((_, layerIdx) => (
                    <React.Fragment key={`lines-layer-${layerIdx}`}>
                      {Array.from({ length: layerIdx === 0 ? 3 : 5 }).map((_, fromIdx) => (
                        <React.Fragment key={`lines-from-${layerIdx}-${fromIdx}`}>
                          {Array.from({ length: layerIdx === 2 ? 3 : 5 }).map((_, toIdx) => {
                            const fromNodeId = `nn-node-${layerIdx}-${fromIdx}`;
                            const toNodeId = `nn-node-${layerIdx+1}-${toIdx}`;
                            const isActive = activeNodes.includes(fromNodeId) || activeNodes.includes(toNodeId);
                            
                            return (
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
                                strokeOpacity={isActive ? 0.8 : 0.2}
                                strokeWidth={isActive ? 2 : 1}
                                className={isActive ? 'text-primary transition-all duration-300' : 'text-muted-foreground'}
                                strokeDasharray={isActive && animationIntensity > 3 ? "4,4" : ""}
                                strokeDashoffset={isActive && animationIntensity > 3 ? "6" : "0"}
                              >
                                {isActive && animationIntensity > 3 && (
                                  <animate 
                                    attributeName="stroke-dashoffset" 
                                    values="12;0" 
                                    dur="1s" 
                                    repeatCount="indefinite" 
                                  />
                                )}
                              </line>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))}
                </svg>
              </div>
              
              <div className="text-xs text-muted-foreground mt-2">
                <div className="flex justify-between">
                  <span>Input Layer</span>
                  <span>Hidden Layers</span>
                  <span>Output Layer</span>
                </div>
              </div>
              
              {/* Training stats */}
              <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-muted-foreground mb-1">Iterations</div>
                  <div className="font-mono">{(10000 + level * 5000).toLocaleString()}</div>
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
      </Card>
    </div>
  );
};

export default Training;
