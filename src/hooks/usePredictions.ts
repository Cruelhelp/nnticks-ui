
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocketClient } from '@/hooks/useWebSocketClient';
import { neuralNetwork, Indicators } from '@/lib/neuralNetwork';
import { predictionService, PredictionData, PredictionType, PredictionOutcome } from '@/services/PredictionService';
import { TickData } from '@/types/chartTypes';
import { toast } from 'sonner';

interface PredictionMode {
  name: string;
  description: string;
  minConfidence: number;
  enabled: boolean;
}

export function usePredictions() {
  const { user } = useAuth();
  const { ticks, latestTick, isConnected } = useWebSocketClient({ autoConnect: true });
  
  const [isRunning, setIsRunning] = useState(false);
  const [predictionMode, setPredictionMode] = useState<'strict' | 'normal' | 'fast'>('normal');
  const [pendingPrediction, setPendingPrediction] = useState<PredictionData | null>(null);
  const [completedPredictions, setCompletedPredictions] = useState<PredictionData[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [tickCountdown, setTickCountdown] = useState<number | null>(null);
  const [pendingTicks, setPendingTicks] = useState<TickData[]>([]);
  const [predictionHistory, setPredictionHistory] = useState<PredictionData[]>([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, winRate: 0 });
  const [lastPredictionTime, setLastPredictionTime] = useState<number | null>(null);
  
  const predictionModes: Record<string, PredictionMode> = {
    strict: {
      name: 'Strict',
      description: 'Only makes predictions with high confidence (75%+)',
      minConfidence: 0.75,
      enabled: true
    },
    normal: {
      name: 'Normal',
      description: 'Makes predictions with moderate confidence (60%+)',
      minConfidence: 0.6,
      enabled: true
    },
    fast: {
      name: 'Fast',
      description: 'Makes predictions with any confidence level',
      minConfidence: 0.51,
      enabled: true
    }
  };
  
  // Set the user ID in the prediction service
  useEffect(() => {
    if (user) {
      predictionService.setUserId(user.id);
    } else {
      predictionService.setUserId(null);
    }
  }, [user]);
  
  // Load prediction history and stats
  const loadData = useCallback(async () => {
    if (!user) return;
    
    const completed = await predictionService.getCompletedPredictions(20);
    setCompletedPredictions(completed);
    
    const pendingPredictions = await predictionService.getPendingPredictions();
    if (pendingPredictions.length > 0) {
      setPendingPrediction(pendingPredictions[0]);
      predictionService.setPendingPrediction(pendingPredictions[0]);
    }
    
    const statsData = await predictionService.getStats();
    setStats(statsData);
  }, [user]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Determine if a new prediction can be made based on time elapsed
  const canMakeNewPrediction = useCallback(() => {
    if (pendingPrediction) return false;
    
    if (lastPredictionTime === null) return true;
    
    // Enforce a minimum delay between predictions (15 seconds)
    const minDelayMs = 15000;
    const now = Date.now();
    return now - lastPredictionTime > minDelayMs;
  }, [pendingPrediction, lastPredictionTime]);
  
  // Calculate indicators for the current market state
  const calculateIndicators = useCallback((ticksData: TickData[]) => {
    if (ticksData.length < 20) return null;
    
    const values = ticksData.map(t => t.value);
    
    return {
      rsi: Indicators.calculateRSI(values),
      ma20: Indicators.calculateMA(values, 20),
      ma50: Indicators.calculateMA(values, 50),
      bollingerBands: Indicators.calculateBollingerBands(values),
      lastPrice: values[values.length - 1],
      priceChange: values[values.length - 1] - values[values.length - 20],
      percentChange: ((values[values.length - 1] - values[values.length - 20]) / values[values.length - 20]) * 100
    };
  }, []);
  
  // Make a prediction based on current market data
  const makePrediction = useCallback(async () => {
    if (!isRunning || !canMakeNewPrediction() || !latestTick || ticks.length < 20) return;
    
    try {
      const indicators = calculateIndicators(ticks);
      if (!indicators) return;
      
      // Determine prediction type based on indicators
      let predictionType: PredictionType = 'rise';
      
      // Check various indicators to determine the prediction
      const { rsi, ma20, lastPrice, priceChange } = indicators;
      
      if (rsi > 70) {
        // Overbought condition suggests price may fall
        predictionType = 'fall';
      } else if (rsi < 30) {
        // Oversold condition suggests price may rise
        predictionType = 'rise';
      } else if (lastPrice > ma20 && priceChange > 0) {
        // Price above MA with positive momentum suggests continued rise
        predictionType = 'rise';
      } else if (lastPrice < ma20 && priceChange < 0) {
        // Price below MA with negative momentum suggests continued fall
        predictionType = 'fall';
      } else {
        // Use neural network for more complex pattern recognition
        const values = ticks.map(t => t.value);
        const prediction = await neuralNetwork.predict(values, predictionType);
        predictionType = prediction.type;
        
        // Calculate confidence and apply mode filter
        const confidence = prediction.confidence;
        const minConfidence = predictionModes[predictionMode].minConfidence;
        
        if (confidence < minConfidence) {
          console.log(`Prediction confidence (${confidence}) too low for ${predictionMode} mode (minimum ${minConfidence})`);
          return;
        }
        
        // Create prediction in database
        const predictionData: PredictionData = {
          type: predictionType,
          confidence,
          timePeriod: 3, // Default to 3 ticks
          market: latestTick.market || 'unknown',
          startPrice: latestTick.value,
          indicators
        };
        
        // Start 10-second countdown
        setCountdown(10);
        
        // Set last prediction time
        setLastPredictionTime(Date.now());
        
        // Create a toast notification
        toast.info(`Preparing ${predictionType.toUpperCase()} prediction (${Math.round(confidence * 100)}% confidence)`, {
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error making prediction:', error);
    }
  }, [isRunning, canMakeNewPrediction, latestTick, ticks, calculateIndicators, predictionMode]);
  
  // Handle the countdown timer
  useEffect(() => {
    if (countdown === null) return;
    
    const timer = setTimeout(() => {
      if (countdown > 0) {
        setCountdown(countdown - 1);
      } else {
        // Countdown complete, create the prediction
        if (latestTick && ticks.length >= 20) {
          const indicators = calculateIndicators(ticks);
          if (!indicators) return;
          
          // Use neural network for prediction
          const values = ticks.map(t => t.value);
          neuralNetwork.predict(values).then(async prediction => {
            const predictionData: PredictionData = {
              type: prediction.type,
              confidence: prediction.confidence,
              timePeriod: 3, // Default to 3 ticks
              market: latestTick.market || 'unknown',
              startPrice: latestTick.value,
              indicators
            };
            
            const predictionId = await predictionService.createPrediction(predictionData);
            
            if (predictionId) {
              const newPrediction = {
                ...predictionData,
                id: predictionId,
                userId: user?.id,
                outcome: 'pending' as PredictionOutcome,
                createdAt: new Date().toISOString()
              };
              
              setPendingPrediction(newPrediction);
              predictionService.setPendingPrediction(newPrediction);
              setTickCountdown(3); // Start the 3-tick countdown
              setPendingTicks([]);
              
              // Notify user
              toast.success(`${prediction.type.toUpperCase()} prediction started with ${Math.round(prediction.confidence * 100)}% confidence`, {
                duration: 3000
              });
            }
          });
        }
        
        setCountdown(null);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown, latestTick, ticks, calculateIndicators, user]);
  
  // Handle new ticks for pending predictions
  useEffect(() => {
    if (!pendingPrediction || tickCountdown === null || !latestTick) return;
    
    // Add new tick to pending ticks
    setPendingTicks(prev => [...prev, latestTick]);
    
    // Decrement tick countdown
    if (pendingTicks.length >= tickCountdown) {
      // Tick countdown complete, evaluate prediction
      if (pendingPrediction.id && pendingPrediction.startPrice !== undefined) {
        const endPrice = latestTick.value;
        let outcome: PredictionOutcome = 'pending';
        
        // Determine outcome based on prediction type
        switch (pendingPrediction.type) {
          case 'rise':
            outcome = endPrice > pendingPrediction.startPrice ? 'win' : 'loss';
            break;
          case 'fall':
            outcome = endPrice < pendingPrediction.startPrice ? 'win' : 'loss';
            break;
          case 'odd':
            outcome = Math.round(endPrice * 100) % 2 === 1 ? 'win' : 'loss';
            break;
          case 'even':
            outcome = Math.round(endPrice * 100) % 2 === 0 ? 'win' : 'loss';
            break;
        }
        
        // Complete prediction
        predictionService.completePrediction(pendingPrediction.id, endPrice, outcome).then(success => {
          if (success) {
            const completedPrediction = {
              ...pendingPrediction,
              endPrice,
              outcome,
              completedAt: new Date().toISOString()
            };
            
            // Update completed predictions
            setCompletedPredictions(prev => [completedPrediction, ...prev]);
            
            // Clear pending prediction
            setPendingPrediction(null);
            predictionService.setPendingPrediction(null);
            
            // Update stats
            setStats(prev => ({
              wins: outcome === 'win' ? prev.wins + 1 : prev.wins,
              losses: outcome === 'loss' ? prev.losses + 1 : prev.losses,
              winRate: (outcome === 'win' ? prev.wins + 1 : prev.wins) / (prev.wins + prev.losses + 1) * 100
            }));
            
            // Notify user
            toast[outcome === 'win' ? 'success' : 'error'](
              `Prediction ${outcome === 'win' ? 'WON' : 'LOST'}: ${pendingPrediction.type.toUpperCase()} (${pendingPrediction.startPrice} → ${endPrice})`,
              { duration: 5000 }
            );
          }
        });
      }
      
      setTickCountdown(null);
      setPendingTicks([]);
    } else {
      setTickCountdown(tickCountdown - 1);
    }
  }, [latestTick, pendingTicks.length]);
  
  // Auto-run the prediction engine when isRunning is true
  useEffect(() => {
    if (!isRunning || !isConnected) return;
    
    const interval = setInterval(() => {
      makePrediction();
    }, 5000); // Check for prediction opportunities every 5 seconds
    
    return () => clearInterval(interval);
  }, [isRunning, isConnected, makePrediction]);
  
  return {
    isRunning,
    startBot: () => setIsRunning(true),
    stopBot: () => setIsRunning(false),
    predictionMode,
    setPredictionMode,
    predictionModes,
    pendingPrediction,
    completedPredictions,
    countdown,
    tickCountdown,
    pendingTicks,
    stats,
    refreshData: loadData
  };
}
