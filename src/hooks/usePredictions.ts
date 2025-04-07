import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { Indicators } from '@/lib/indicators';
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
  const { ticks, latestTick, isConnected } = useWebSocket({ autoConnect: true });
  
  const [isRunning, setIsRunning] = useState(false);
  const [predictionMode, setPredictionMode] = useState<'strict' | 'normal' | 'fast'>('normal');
  const [pendingPrediction, setPendingPrediction] = useState<PredictionData | null>(null);
  const [completedPredictions, setCompletedPredictions] = useState<PredictionData[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [tickCountdown, setTickCountdown] = useState<number | null>(null);
  const [pendingTicks, setPendingTicks] = useState<TickData[]>([]);
  const [predictionHistory, setPredictionHistory] = useState<PredictionData[]>([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, winRate: 0 });
  
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
  
  useEffect(() => {
    if (user) {
      predictionService.setUserId(user.id);
    } else {
      predictionService.setUserId(null);
    }
  }, [user]);
  
  const loadData = useCallback(async () => {
    if (!user) return;
    
    const completed = await predictionService.getCompletedPredictions(20);
    setCompletedPredictions(completed);
    
    const pendingPredictions = await predictionService.getPendingPredictions();
    if (pendingPredictions.length > 0) {
      setPendingPrediction(pendingPredictions[0]);
      predictionService.setPendingPrediction(pendingPredictions[0]);
      
      if (localStorage.getItem('tickCountdown')) {
        const storedCountdown = parseInt(localStorage.getItem('tickCountdown') || '0', 10);
        setTickCountdown(storedCountdown);
        predictionService.setTickCountdownActive(true);
      }
    }
    
    const statsData = await predictionService.getStats();
    setStats(statsData);
  }, [user]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const canMakeNewPrediction = useCallback(() => {
    return predictionService.canMakeNewPrediction();
  }, []);
  
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
  
  const makePrediction = useCallback(async () => {
    if (!isRunning || !canMakeNewPrediction() || !latestTick || ticks.length < 20) return;
    
    try {
      const indicators = calculateIndicators(ticks);
      if (!indicators) return;
      
      const values = ticks.map(t => t.value);
      const prediction = await neuralNetwork.predict(values);
      
      const confidence = prediction.confidence;
      const minConfidence = predictionModes[predictionMode].minConfidence;
      
      if (confidence < minConfidence) {
        console.log(`Prediction confidence (${confidence}) too low for ${predictionMode} mode (minimum ${minConfidence})`);
        return;
      }
      
      const predictionType = prediction.type;
      
      const predictionData: PredictionData = {
        type: predictionType,
        confidence,
        timePeriod: 3,
        market: latestTick.market || 'unknown',
        startPrice: latestTick.value,
        indicators
      };
      
      setCountdown(10);
      
      toast.info(`Preparing ${predictionType.toUpperCase()} prediction (${Math.round(confidence * 100)}% confidence)`, {
        duration: 5000
      });
    } catch (error) {
      console.error('Error making prediction:', error);
    }
  }, [isRunning, canMakeNewPrediction, latestTick, ticks, calculateIndicators, predictionMode, predictionModes]);
  
  useEffect(() => {
    if (countdown === null) return;
    
    const timer = setTimeout(() => {
      if (countdown > 0) {
        setCountdown(countdown - 1);
      } else {
        if (latestTick && ticks.length >= 20) {
          const indicators = calculateIndicators(ticks);
          if (!indicators) return;
          
          const values = ticks.map(t => t.value);
          neuralNetwork.predict(values).then(async prediction => {
            const predictionData: PredictionData = {
              type: prediction.type,
              confidence: prediction.confidence,
              timePeriod: 3,
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
              predictionService.setTickCountdownActive(true);
              setTickCountdown(3);
              setPendingTicks([]);
              
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
  
  useEffect(() => {
    if (pendingPrediction) {
      localStorage.setItem('pendingPrediction', JSON.stringify(pendingPrediction));
    } else {
      localStorage.removeItem('pendingPrediction');
    }
    
    if (tickCountdown !== null) {
      localStorage.setItem('tickCountdown', tickCountdown.toString());
    } else {
      localStorage.removeItem('tickCountdown');
    }
  }, [pendingPrediction, tickCountdown]);
  
  useEffect(() => {
    if (!pendingPrediction) {
      const storedPrediction = localStorage.getItem('pendingPrediction');
      if (storedPrediction) {
        try {
          const parsedPrediction = JSON.parse(storedPrediction);
          setPendingPrediction(parsedPrediction);
          predictionService.setPendingPrediction(parsedPrediction);
          
          if (localStorage.getItem('tickCountdown')) {
            const countdown = parseInt(localStorage.getItem('tickCountdown') || '0', 10);
            setTickCountdown(countdown);
            predictionService.setTickCountdownActive(true);
          }
        } catch (e) {
          console.error('Error parsing stored prediction:', e);
          localStorage.removeItem('pendingPrediction');
          localStorage.removeItem('tickCountdown');
        }
      }
    }
  }, [pendingPrediction]);
  
  useEffect(() => {
    if (!pendingPrediction || tickCountdown === null || !latestTick) return;
    
    setPendingTicks(prev => [...prev, latestTick]);
    
    if (pendingTicks.length >= tickCountdown) {
      if (pendingPrediction.id && pendingPrediction.startPrice !== undefined) {
        const endPrice = latestTick.value;
        let outcome: PredictionOutcome = 'pending';
        
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
        
        predictionService.completePrediction(pendingPrediction.id, endPrice, outcome).then(success => {
          if (success) {
            const completedPrediction = {
              ...pendingPrediction,
              endPrice,
              outcome,
              completedAt: new Date().toISOString()
            };
            
            setCompletedPredictions(prev => [completedPrediction, ...prev]);
            
            setPendingPrediction(null);
            predictionService.setPendingPrediction(null);
            predictionService.setTickCountdownActive(false);
            
            setStats(prev => ({
              wins: outcome === 'win' ? prev.wins + 1 : prev.wins,
              losses: outcome === 'loss' ? prev.losses + 1 : prev.losses,
              winRate: (outcome === 'win' ? prev.wins + 1 : prev.wins) / (prev.wins + prev.losses + 1) * 100
            }));
            
            localStorage.removeItem('pendingPrediction');
            localStorage.removeItem('tickCountdown');
            
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
  }, [latestTick, pendingTicks.length, pendingPrediction, tickCountdown]);
  
  useEffect(() => {
    if (!isRunning || !isConnected) return;
    
    const interval = setInterval(() => {
      if (canMakeNewPrediction()) {
        makePrediction();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isRunning, isConnected, makePrediction, canMakeNewPrediction]);
  
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
