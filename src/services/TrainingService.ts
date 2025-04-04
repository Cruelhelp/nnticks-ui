
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface TrainingSession {
  id: string;
  userId: string;
  startedAt: string;
  completedAt: string | null;
  epochs: number;
  accuracy: number | null;
  model: any | null;
}

class TrainingService {
  private userId: string | null = null;
  
  setUserId(userId: string | null) {
    this.userId = userId;
  }
  
  async startTrainingSession(epochs: number): Promise<string | null> {
    if (!this.userId) return null;
    
    // Check if user has enough epochs available
    const availableEpochs = await this.getAvailableEpochs();
    if (availableEpochs < epochs) {
      toast.error(`Not enough epochs available. You have ${availableEpochs} but need ${epochs}.`);
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .insert({
          user_id: this.userId,
          started_at: new Date().toISOString(),
          epochs: epochs,
          status: 'in_progress'
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error('Error starting training session:', error);
      return null;
    }
  }
  
  async completeTrainingSession(sessionId: string, accuracy: number, model: any): Promise<boolean> {
    if (!this.userId) return false;
    
    try {
      const { error } = await supabase
        .from('training_sessions')
        .update({
          completed_at: new Date().toISOString(),
          accuracy: accuracy,
          model: model,
          status: 'completed'
        })
        .eq('id', sessionId)
        .eq('user_id', this.userId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error completing training session:', error);
      return false;
    }
  }
  
  async addTrainingHistory(data: {
    accuracy: number;
    points: number;
    modelData?: any;
    mission: string;
  }): Promise<string | null> {
    if (!this.userId) return null;
    
    try {
      const { data: result, error } = await supabase
        .from('training_history')
        .insert({
          user_id: this.userId,
          date: new Date().toISOString(),
          accuracy: data.accuracy,
          points: data.points,
          model_data: data.modelData || null,
          mission: data.mission
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      return result.id;
    } catch (error) {
      console.error('Error adding training history:', error);
      return null;
    }
  }
  
  async getTrainingHistory(limit: number = 10): Promise<any[]> {
    if (!this.userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('training_history')
        .select('*')
        .eq('user_id', this.userId)
        .order('date', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting training history:', error);
      return [];
    }
  }
  
  async addEpochs(epochs: number): Promise<number> {
    if (!this.userId) return 0;
    
    try {
      // Get current epochs count
      const currentEpochs = await this.getAvailableEpochs();
      
      // Update epochs in user_epochs table
      const newEpochs = currentEpochs + epochs;
      
      const { error } = await supabase
        .from('user_epochs')
        .upsert({
          user_id: this.userId,
          epochs: newEpochs,
          last_updated: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.success(`Added ${epochs} training epochs`);
      return newEpochs;
    } catch (error) {
      console.error('Error adding epochs:', error);
      return 0;
    }
  }
  
  async useEpochs(epochs: number): Promise<number> {
    if (!this.userId) return 0;
    
    try {
      // Get current epochs count
      const currentEpochs = await this.getAvailableEpochs();
      
      if (currentEpochs < epochs) {
        toast.error(`Not enough epochs available. You have ${currentEpochs} but need ${epochs}.`);
        throw new Error('Not enough epochs available');
      }
      
      // Update epochs in user_epochs table
      const newEpochs = currentEpochs - epochs;
      
      const { error } = await supabase
        .from('user_epochs')
        .upsert({
          user_id: this.userId,
          epochs: newEpochs,
          last_updated: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.info(`Used ${epochs} training epochs`);
      return newEpochs;
    } catch (error) {
      console.error('Error using epochs:', error);
      return currentEpochs;
    }
  }
  
  async getAvailableEpochs(): Promise<number> {
    if (!this.userId) return 0;
    
    try {
      const { data, error } = await supabase
        .from('user_epochs')
        .select('epochs')
        .eq('user_id', this.userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, initialize with 0 epochs
          return 0;
        }
        throw error;
      }
      
      return data?.epochs || 0;
    } catch (error) {
      console.error('Error getting available epochs:', error);
      return 0;
    }
  }
}

export const trainingService = new TrainingService();
export default trainingService;
