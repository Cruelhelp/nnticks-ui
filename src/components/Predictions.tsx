
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowDown, ArrowUp, Clock } from 'lucide-react';
import { PredictionType, neuralNetwork } from '@/lib/neuralNetwork';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface PredictionCardProps {
  type: PredictionType;
  confidence: number;
  timeLeft?: number;
  completed?: boolean;
  outcome?: 'win' | 'loss' | undefined;
}

const PredictionCard = ({ type, confidence, timeLeft, completed, outcome }: PredictionCardProps) => {
  const isRise = type === 'rise';
  const isEven = type === 'even';
  
  const getBadgeVariant = () => {
    if (completed) {
      return outcome === 'win' ? 'default' : 'destructive';
    }
    return 'outline';
  };
  
  return (
    <Card className={`${completed && 'opacity-75'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center text-lg">
          <div className="flex items-center gap-2">
            {isRise || isEven ? (
              <ArrowUp className="text-green-500" />
            ) : (
              <ArrowDown className="text-red-500" />
            )}
            <span>{isRise || type === 'fall' ? (isRise ? 'Rise' : 'Fall') : (isEven ? 'Even' : 'Odd')}</span>
          </div>
          <Badge variant={getBadgeVariant()}>
            {completed ? (outcome === 'win' ? 'Win' : 'Loss') : `${Math.round(confidence * 100)}%`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {completed ? (
          <p className="text-sm text-muted-foreground">
            {outcome === 'win' 
              ? 'Prediction was correct' 
              : 'Prediction was incorrect'}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Confidence: {confidence > 0.8 ? 'Strong' : 'Weak'} signal
          </p>
        )}
        
        {!completed && timeLeft !== undefined && (
          <div className="mt-4 text-center">
            <div className="text-3xl font-bold countdown">
              {timeLeft}s
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Get ready to trade
            </p>
          </div>
        )}
      </CardContent>
      {completed && (
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleTimeString()}
          </p>
        </CardFooter>
      )}
    </Card>
  );
};

const Predictions = () => {
  const { user } = useAuth();
  const [activePrediction, setActivePrediction] = useState<{
    type: PredictionType;
    confidence: number;
    startTime: Date;
    timeLeft: number;
  } | null>(null);
  
  const [completedPredictions, setCompletedPredictions] = useState<{
    id: number;
    type: PredictionType;
    confidence: number;
    timestamp: Date;
    outcome: 'win' | 'loss';
  }[]>([]);
  
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [countdownInterval]);
  
  // Generate a prediction
  const generatePrediction = async () => {
    if (activePrediction) {
      toast.error("Wait for the current prediction to complete");
      return;
    }
    
    try {
      // Generate random tick data for demo
      const fakeTicks = Array(100).fill(0).map((_, i) => 
        100 + Math.sin(i / 10) * 5 + Math.random() * 2
      );
      
      // Get prediction from neural network
      const prediction = await neuralNetwork.predict(fakeTicks);
      
      // Start countdown
      const newPrediction = {
        type: prediction.type,
        confidence: prediction.confidence,
        startTime: new Date(),
        timeLeft: 10
      };
      
      setActivePrediction(newPrediction);
      
      // Notify the user
      toast.info(`New prediction generated: ${prediction.type.toUpperCase()}`);
      
      // Start countdown
      const interval = setInterval(() => {
        setActivePrediction(prev => {
          if (prev && prev.timeLeft > 0) {
            return { ...prev, timeLeft: prev.timeLeft - 1 };
          } else if (prev) {
            // When countdown finishes
            clearInterval(interval);
            
            // Simulate outcome (70% win rate if confidence > 0.8, 55% win rate otherwise)
            const isWin = Math.random() < (prev.confidence > 0.8 ? 0.7 : 0.55);
            
            // Add to completed predictions
            const completedPrediction = {
              id: Date.now(),
              type: prev.type,
              confidence: prev.confidence,
              timestamp: new Date(),
              outcome: isWin ? 'win' : 'loss'
            };
            
            setCompletedPredictions(prevCompleted => 
              [completedPrediction, ...prevCompleted].slice(0, 10)
            );
            
            // Save to Supabase if user is logged in
            if (user) {
              savePredictionToSupabase(completedPrediction);
            }
            
            // Notify the user
            toast.success(
              isWin ? 'Prediction correct!' : 'Prediction incorrect',
              { description: `${prev.type.toUpperCase()} prediction completed` }
            );
            
            return null;
          }
          return null;
        });
      }, 1000);
      
      setCountdownInterval(interval);
      
    } catch (error) {
      console.error('Error generating prediction:', error);
      toast.error('Failed to generate prediction');
    }
  };
  
  // Save prediction to Supabase
  const savePredictionToSupabase = async (prediction: any) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.from('trade_history').insert({
        user_id: user.id,
        timestamp: new Date().toISOString(),
        market: 'DEMO',
        prediction: prediction.type,
        confidence: prediction.confidence,
        outcome: prediction.outcome === 'win' ? 'win' : 'loss'
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving prediction:', error);
    }
  };
  
  // Load past predictions from Supabase
  useEffect(() => {
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
          const processed = data.map(item => ({
            id: item.id,
            type: item.prediction as PredictionType,
            confidence: item.confidence,
            timestamp: new Date(item.timestamp),
            outcome: item.outcome === 'win' ? 'win' : 'loss' as 'win' | 'loss'
          }));
          
          setCompletedPredictions(processed);
        }
      } catch (error) {
        console.error('Error loading predictions:', error);
      }
    };
    
    loadPredictions();
  }, [user]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Neural Network Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The neural network analyzes market data to predict price movements.
              When a prediction is generated, you'll get a 10-second countdown to prepare for your trade.
            </p>
            
            <div className="flex justify-center">
              <Button 
                onClick={generatePrediction} 
                disabled={!!activePrediction}
                className="w-full max-w-xs"
              >
                Generate Prediction
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4">
        {activePrediction && (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Current Prediction</h3>
            <PredictionCard 
              type={activePrediction.type} 
              confidence={activePrediction.confidence}
              timeLeft={activePrediction.timeLeft}
            />
          </div>
        )}
        
        {completedPredictions.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Past Predictions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedPredictions.map(prediction => (
                <PredictionCard 
                  key={prediction.id}
                  type={prediction.type}
                  confidence={prediction.confidence}
                  completed={true}
                  outcome={prediction.outcome}
                />
              ))}
            </div>
          </div>
        )}
        
        {!activePrediction && completedPredictions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Clock size={48} className="mb-4" />
            <p>No predictions yet</p>
            <p className="text-sm">Generate a prediction to start</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Predictions;
