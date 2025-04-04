
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { NNConfiguration, NetworkModel } from '@/lib/neuralNetwork';

export interface TrainingMission {
  id: number;
  title: string;
  description: string;
  points: number;
  epochs: number;
  locked: boolean;
  completed: boolean;
  requiredLevel?: number;
  proBadge?: boolean;
}

export interface TrainingResult {
  missionId: number;
  epochs: number;
  accuracy: number;
  points: number;
  modelData?: NetworkModel;
}

export interface TrainingHistoryItem {
  id: string;
  mission: string;
  epochs: number;
  accuracy: number;
  points: number;
  date: string;
  modelId?: string;
}

class TrainingService {
  private userId: string | null = null;
  
  setUserId(userId: string | null) {
    this.userId = userId;
  }
  
  async getUserEpochs(): Promise<{ available: number, total: number }> {
    if (!this.userId) return { available: 0, total: 0 };
    
    try {
      const { data, error } = await supabase
        .from('users_extra')
        .select('available_epochs, total_epochs')
        .eq('user_id', this.userId)
        .single();
      
      if (error) throw error;
      
      return {
        available: data?.available_epochs || 0,
        total: data?.total_epochs || 0
      };
    } catch (error) {
      console.error('Error getting user epochs:', error);
      return { available: 0, total: 0 };
    }
  }
  
  async addEpochs(count: number): Promise<boolean> {
    if (!this.userId) return false;
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users_extra')
        .select('available_epochs, total_epochs')
        .eq('user_id', this.userId)
        .single();
      
      if (userError) throw userError;
      
      const newAvailable = (userData?.available_epochs || 0) + count;
      const newTotal = (userData?.total_epochs || 0) + count;
      
      const { error } = await supabase
        .from('users_extra')
        .update({
          available_epochs: newAvailable,
          total_epochs: newTotal
        })
        .eq('user_id', this.userId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error adding epochs:', error);
      return false;
    }
  }
  
  async useEpochs(count: number): Promise<boolean> {
    if (!this.userId) return false;
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users_extra')
        .select('available_epochs')
        .eq('user_id', this.userId)
        .single();
      
      if (userError) throw userError;
      
      if ((userData?.available_epochs || 0) < count) {
        toast.error(`Not enough epochs. You need ${count} but have ${userData?.available_epochs || 0}`);
        return false;
      }
      
      const newAvailable = (userData?.available_epochs || 0) - count;
      
      const { error } = await supabase
        .from('users_extra')
        .update({
          available_epochs: newAvailable
        })
        .eq('user_id', this.userId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error using epochs:', error);
      return false;
    }
  }
  
  async saveMissionResult(result: TrainingResult): Promise<string | null> {
    if (!this.userId) return null;
    
    try {
      // Record the training history
      const { data, error } = await supabase
        .from('training_history')
        .insert({
          user_id: this.userId,
          mission: `Mission ${result.missionId}`,
          epochs: result.epochs,
          accuracy: result.accuracy,
          points: result.points,
          model_data: result.modelData,
          completed: true
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Update leaderboard
      await this.updateLeaderboard(result.points, result.epochs, result.accuracy);
      
      return data.id;
    } catch (error) {
      console.error('Error saving mission result:', error);
      return null;
    }
  }
  
  async saveModel(name: string, config: NNConfiguration, accuracy: number, weights: any): Promise<string | null> {
    if (!this.userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('models')
        .insert({
          user_id: this.userId,
          name,
          config,
          accuracy,
          weights,
          epochs_trained: config.epochs
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error('Error saving model:', error);
      return null;
    }
  }
  
  async getModels(): Promise<any[]> {
    if (!this.userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting models:', error);
      return [];
    }
  }
  
  async getTrainingHistory(): Promise<TrainingHistoryItem[]> {
    if (!this.userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('training_history')
        .select('*')
        .eq('user_id', this.userId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        mission: item.mission,
        epochs: item.epochs,
        accuracy: item.accuracy,
        points: item.points,
        date: item.date,
        modelId: item.model_id
      }));
    } catch (error) {
      console.error('Error getting training history:', error);
      return [];
    }
  }
  
  async getLevel(): Promise<number> {
    if (!this.userId) return 1;
    
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('level')
        .eq('user_id', this.userId)
        .single();
      
      if (error) {
        // If no entry exists, return level 1
        if (error.code === 'PGRST116') return 1;
        throw error;
      }
      
      return data?.level || 1;
    } catch (error) {
      console.error('Error getting user level:', error);
      return 1;
    }
  }
  
  async updateLeaderboard(points: number, epochs: number, accuracy: number): Promise<boolean> {
    if (!this.userId) return false;
    
    try {
      // Get current leaderboard entry if it exists
      const { data: existingData, error: fetchError } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', this.userId)
        .single();
      
      // Get username
      const { data: userData, error: userError } = await supabase
        .from('users_extra')
        .select('username')
        .eq('user_id', this.userId)
        .single();
      
      if (userError) throw userError;
      
      const username = userData?.username || 'Anonymous';
      
      // Calculate new values
      let newPoints = points;
      let newEpochs = epochs;
      let newAccuracy = accuracy;
      let newLevel = 1;
      
      // If entry exists, update values
      if (!fetchError && existingData) {
        newPoints += existingData.points || 0;
        newEpochs += existingData.epochs || 0;
        newAccuracy = (existingData.accuracy + accuracy) / 2; // Average accuracy
        
        // Calculate level based on points
        if (newPoints >= 800) newLevel = 5;
        else if (newPoints >= 500) newLevel = 4;
        else if (newPoints >= 250) newLevel = 3;
        else if (newPoints >= 100) newLevel = 2;
        else newLevel = 1;
        
        // Update existing entry
        const { error } = await supabase
          .from('leaderboard')
          .update({
            points: newPoints,
            epochs: newEpochs,
            accuracy: newAccuracy,
            level: newLevel,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', this.userId);
        
        if (error) throw error;
      } else {
        // Create new entry
        const { error } = await supabase
          .from('leaderboard')
          .insert({
            user_id: this.userId,
            username,
            points: newPoints,
            epochs: newEpochs,
            accuracy: newAccuracy,
            level: newLevel
          });
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      return false;
    }
  }
}

export const trainingService = new TrainingService();
export default trainingService;
