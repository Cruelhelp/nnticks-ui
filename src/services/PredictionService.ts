
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type PredictionType = 'rise' | 'fall' | 'odd' | 'even';
export type PredictionOutcome = 'win' | 'loss' | 'pending';

export interface PredictionData {
  id?: string;
  userId?: string;
  type: PredictionType;
  confidence: number;
  timePeriod: number;
  market: string;
  startPrice?: number;
  endPrice?: number;
  outcome?: PredictionOutcome;
  createdAt?: string;
  completedAt?: string;
  indicators?: any;
}

class PredictionService {
  private userId: string | null = null;
  private pendingPrediction: PredictionData | null = null;
  private lastPredictionTime: number | null = null;
  private minimumDelayMs: number = 30000; // 30 seconds minimum delay between predictions
  
  setUserId(userId: string | null) {
    this.userId = userId;
  }
  
  setPendingPrediction(prediction: PredictionData | null) {
    this.pendingPrediction = prediction;
  }
  
  getPendingPrediction() {
    return this.pendingPrediction;
  }
  
  canMakeNewPrediction(): boolean {
    if (this.pendingPrediction) return false;
    
    if (!this.lastPredictionTime) return true;
    
    const now = Date.now();
    return now - this.lastPredictionTime > this.minimumDelayMs;
  }
  
  async createPrediction(prediction: PredictionData): Promise<string | null> {
    if (!this.userId) {
      toast.error('You must be logged in to make predictions');
      return null;
    }
    
    if (!this.canMakeNewPrediction()) {
      const timeLeft = Math.ceil((this.minimumDelayMs - (Date.now() - (this.lastPredictionTime || 0))) / 1000);
      toast.error(`Please wait ${timeLeft} seconds before making another prediction`);
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('predictions')
        .insert({
          user_id: this.userId,
          type: prediction.type,
          confidence: prediction.confidence,
          time_period: prediction.timePeriod,
          market: prediction.market,
          start_price: prediction.startPrice,
          outcome: 'pending',
          indicators: prediction.indicators
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      this.pendingPrediction = {
        ...prediction,
        id: data.id,
        userId: this.userId,
        outcome: 'pending',
        createdAt: new Date().toISOString()
      };
      
      this.lastPredictionTime = Date.now();
      
      return data.id;
    } catch (error) {
      console.error('Error creating prediction:', error);
      toast.error('Failed to create prediction');
      return null;
    }
  }
  
  async completePrediction(id: string, endPrice: number, outcome: PredictionOutcome): Promise<boolean> {
    if (!this.userId) return false;
    
    try {
      const { error } = await supabase
        .from('predictions')
        .update({
          end_price: endPrice,
          outcome: outcome,
          completed_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', this.userId);
      
      if (error) throw error;
      
      if (this.pendingPrediction?.id === id) {
        this.pendingPrediction = null;
      }
      
      return true;
    } catch (error) {
      console.error('Error completing prediction:', error);
      return false;
    }
  }
  
  async getPendingPredictions(): Promise<PredictionData[]> {
    if (!this.userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', this.userId)
        .eq('outcome', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(p => ({
        id: p.id,
        userId: p.user_id,
        type: p.type,
        confidence: p.confidence,
        timePeriod: p.time_period,
        market: p.market,
        startPrice: p.start_price,
        endPrice: p.end_price,
        outcome: p.outcome,
        createdAt: p.created_at,
        completedAt: p.completed_at,
        indicators: p.indicators
      }));
    } catch (error) {
      console.error('Error getting pending predictions:', error);
      return [];
    }
  }
  
  async getCompletedPredictions(limit: number = 10, offset: number = 0): Promise<PredictionData[]> {
    if (!this.userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', this.userId)
        .neq('outcome', 'pending')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      return (data || []).map(p => ({
        id: p.id,
        userId: p.user_id,
        type: p.type,
        confidence: p.confidence,
        timePeriod: p.time_period,
        market: p.market,
        startPrice: p.start_price,
        endPrice: p.end_price,
        outcome: p.outcome,
        createdAt: p.created_at,
        completedAt: p.completed_at,
        indicators: p.indicators
      }));
    } catch (error) {
      console.error('Error getting completed predictions:', error);
      return [];
    }
  }
  
  async getStats(): Promise<{ wins: number, losses: number, winRate: number }> {
    if (!this.userId) return { wins: 0, losses: 0, winRate: 0 };
    
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('outcome')
        .eq('user_id', this.userId)
        .neq('outcome', 'pending');
      
      if (error) throw error;
      
      const wins = data.filter(p => p.outcome === 'win').length;
      const total = data.length;
      
      return {
        wins,
        losses: total - wins,
        winRate: total > 0 ? (wins / total) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting prediction stats:', error);
      return { wins: 0, losses: 0, winRate: 0 };
    }
  }
}

export const predictionService = new PredictionService();
export default predictionService;
