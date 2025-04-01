
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Upload, Database, Brain } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Mission {
  id: number;
  title: string;
  description: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  proOnly: boolean;
  completed?: boolean;
}

const Training = () => {
  const { user, userDetails } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progress, setProgress] = useState({
    level: 1,
    points: 0,
    totalPoints: 0,
    nextLevelPoints: 100
  });
  
  const isPro = userDetails?.proStatus || false;
  
  // Load missions
  useEffect(() => {
    const missionsList: Mission[] = [
      {
        id: 1,
        title: 'First Steps',
        description: 'Connect to a broker API and stream 100 ticks.',
        points: 10,
        difficulty: 'easy',
        proOnly: false
      },
      {
        id: 2,
        title: 'Data Analyst',
        description: 'Upload a CSV with historical tick data.',
        points: 15,
        difficulty: 'easy',
        proOnly: false
      },
      {
        id: 3,
        title: 'Prediction Novice',
        description: 'Generate 10 predictions with the neural network.',
        points: 20,
        difficulty: 'easy',
        proOnly: false
      },
      {
        id: 4,
        title: 'Accuracy Hunter',
        description: 'Achieve 65% accuracy over 20 predictions.',
        points: 30,
        difficulty: 'medium',
        proOnly: false
      },
      {
        id: 5,
        title: 'Pattern Spotter',
        description: 'Identify a market pattern using indicators.',
        points: 25,
        difficulty: 'medium',
        proOnly: false
      },
      {
        id: 6,
        title: 'Neural Trainer',
        description: 'Train the neural network with 500+ data points.',
        points: 40,
        difficulty: 'medium',
        proOnly: true
      },
      {
        id: 7,
        title: 'Network Architect',
        description: 'Customize the neural network parameters for optimal performance.',
        points: 50,
        difficulty: 'hard',
        proOnly: true
      },
      {
        id: 8,
        title: 'Trading Master',
        description: 'Achieve 80% accuracy over 50 predictions.',
        points: 75,
        difficulty: 'hard',
        proOnly: true
      },
      {
        id: 9,
        title: 'Data Scientist',
        description: 'Create and share a trained model with 85%+ accuracy.',
        points: 100,
        difficulty: 'hard',
        proOnly: true
      },
      {
        id: 10,
        title: 'Market Guru',
        description: 'Complete all other missions and reach the leaderboard.',
        points: 150,
        difficulty: 'hard',
        proOnly: true
      }
    ];
    
    setMissions(missionsList);
    
    // If user is logged in, fetch their completed missions
    if (user) {
      loadUserTrainingData();
    }
  }, [user]);
  
  // Load user training data from Supabase
  const loadUserTrainingData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('training_history')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Calculate total points
        const points = data.reduce((sum, item) => sum + item.points, 0);
        
        // Update missions with completion status
        const completedMissionIds = data.map(item => {
          // Extract mission ID from mission title if it exists
          const match = item.mission.match(/Mission #(\d+)/);
          return match ? parseInt(match[1]) : -1;
        }).filter(id => id > 0);
        
        setMissions(prev => prev.map(mission => ({
          ...mission,
          completed: completedMissionIds.includes(mission.id)
        })));
        
        // Calculate level
        let level = 1;
        if (points > 100) level = 2;
        if (points > 250) level = 3;
        if (points > 500) level = 4;
        if (points > 1000) level = 5;
        
        const nextLevelPoints = level === 1 ? 100 : 
                             level === 2 ? 250 :
                             level === 3 ? 500 :
                             level === 4 ? 1000 : 2000;
        
        setProgress({
          level,
          points,
          totalPoints: points,
          nextLevelPoints
        });
      }
    } catch (error) {
      console.error('Error loading training data:', error);
    }
  };
  
  // Start a mission
  const startMission = async (mission: Mission) => {
    if (!user) {
      toast.error('You need to sign in to start missions');
      return;
    }
    
    if (mission.proOnly && !isPro) {
      toast.error('This mission requires a Pro subscription');
      return;
    }
    
    if (mission.completed) {
      toast.info('Mission already completed');
      return;
    }
    
    // Simulate mission progress
    toast.loading(`Starting mission: ${mission.title}`, { id: 'mission' });
    
    // Simulate mission completion after delay
    setTimeout(async () => {
      // Simulate mission outcome (80% chance of success)
      const success = Math.random() < 0.8;
      
      if (success) {
        // Update local state
        setMissions(prev => prev.map(m => 
          m.id === mission.id ? { ...m, completed: true } : m
        ));
        
        // Add points to progress
        const newPoints = progress.points + mission.points;
        
        setProgress(prev => {
          // Calculate new level
          let newLevel = prev.level;
          if (newPoints > 100 && prev.level === 1) newLevel = 2;
          else if (newPoints > 250 && prev.level === 2) newLevel = 3;
          else if (newPoints > 500 && prev.level === 3) newLevel = 4;
          else if (newPoints > 1000 && prev.level === 4) newLevel = 5;
          
          const nextLevelPoints = newLevel === 1 ? 100 : 
                               newLevel === 2 ? 250 :
                               newLevel === 3 ? 500 :
                               newLevel === 4 ? 1000 : 2000;
          
          return {
            level: newLevel,
            points: newPoints,
            totalPoints: newPoints,
            nextLevelPoints
          };
        });
        
        // Save to Supabase
        try {
          const { error } = await supabase.from('training_history').insert({
            user_id: user.id,
            mission: `Mission #${mission.id}: ${mission.title}`,
            date: new Date().toISOString(),
            points: mission.points,
            accuracy: 0.75 + Math.random() * 0.15 // 75-90% accuracy
          });
          
          if (error) throw error;
          
          // Update leaderboard if Pro user
          if (isPro) {
            updateLeaderboard();
          }
          
          toast.success(`Mission Completed: ${mission.title}`, { 
            id: 'mission',
            description: `You earned ${mission.points} points!`
          });
          
          // Level up notification
          if (progress.level < newLevel) {
            toast.success(`Congratulations! You reached Level ${newLevel}!`);
          }
        } catch (error) {
          console.error('Error saving mission completion:', error);
          toast.error('Failed to save mission progress', { id: 'mission' });
        }
      } else {
        toast.error(`Mission Failed: ${mission.title}`, { 
          id: 'mission', 
          description: 'Try again later'
        });
      }
    }, 3000);
  };
  
  // Update leaderboard
  const updateLeaderboard = async () => {
    if (!user || !userDetails) return;
    
    try {
      // Calculate average accuracy
      const { data: trainingData, error: trainingError } = await supabase
        .from('training_history')
        .select('accuracy')
        .eq('user_id', user.id);
        
      if (trainingError) throw trainingError;
      
      if (trainingData && trainingData.length > 0) {
        const accuracyValues = trainingData.map(item => item.accuracy);
        const avgAccuracy = accuracyValues.reduce((sum, val) => sum + val, 0) / accuracyValues.length;
        
        // Update or insert leaderboard entry
        const { error } = await supabase
          .from('leaderboard')
          .upsert({
            user_id: user.id,
            username: userDetails.username,
            accuracy: avgAccuracy,
            level: progress.level
          });
          
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!user) {
      toast.error('You need to sign in to upload files');
      return;
    }
    
    // Check file size
    if (file.size > 1024 * 1024 * 1024) { // 1GB
      toast.error('File size exceeds 1GB limit');
      return;
    }
    
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Only CSV files are supported');
      return;
    }
    
    toast.loading('Uploading historical data...', { id: 'upload' });
    
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error } = await supabase.storage
        .from('historical_ticks')
        .upload(filePath, file);
        
      if (error) throw error;
      
      toast.success('CSV file uploaded successfully!', { id: 'upload' });
      
      // Complete the "Data Analyst" mission if not already completed
      const dataAnalystMission = missions.find(m => m.id === 2);
      if (dataAnalystMission && !dataAnalystMission.completed) {
        startMission(dataAnalystMission);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file', { id: 'upload' });
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="text-amber-500" />
              Bot Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-2">
              <span className="text-xl font-bold">Level {progress.level}</span>
              <span className="text-muted-foreground">{progress.points}/{progress.nextLevelPoints} points</span>
            </div>
            <Progress value={(progress.points / progress.nextLevelPoints) * 100} className="h-2" />
            
            <div className="mt-4 text-center">
              <Badge variant="outline" className="bg-primary/10">
                {progress.level === 1 ? 'Novice Trader' :
                 progress.level === 2 ? 'Apprentice Trader' :
                 progress.level === 3 ? 'Expert Trader' :
                 progress.level === 4 ? 'Master Trader' : 'Legendary Trader'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="text-blue-500" />
              Historical Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload historical tick data to train your neural network
            </p>
            
            <div className="flex justify-center">
              <Button variant="outline" className="w-full" asChild>
                <label className="cursor-pointer flex items-center justify-center gap-2">
                  <Upload size={16} />
                  Upload CSV
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Max file size: 1GB
          </CardFooter>
        </Card>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Training Missions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.filter(m => !m.proOnly || isPro).slice(0, isPro ? undefined : 5).map(mission => (
            <Card key={mission.id} className={`mission-card ${mission.completed ? 'bg-primary/5' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-lg">
                  <span>{mission.title}</span>
                  <Badge variant={
                    mission.difficulty === 'easy' ? 'outline' :
                    mission.difficulty === 'medium' ? 'secondary' : 'default'
                  }>
                    {mission.difficulty}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{mission.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <span className="text-sm">{mission.points} pts</span>
                <Button 
                  size="sm" 
                  variant={mission.completed ? "outline" : "default"}
                  disabled={mission.completed}
                  onClick={() => startMission(mission)}
                >
                  {mission.completed ? 'Completed' : 'Start Mission'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {!isPro && (
          <Card className="mt-6 border-dashed">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-center flex-col gap-4">
                <Brain size={48} className="text-muted-foreground" />
                <div className="text-center">
                  <h3 className="text-lg font-medium">Unlock All Missions</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upgrade to Pro to access all 10 training missions
                  </p>
                </div>
                <Button>Upgrade to Pro</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Training;
