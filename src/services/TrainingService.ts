import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { NetworkModel } from '@/lib/neuralNetwork';

export interface TrainingSession {
  id: string;
  userId: string;
  startedAt: string;
  completedAt: string | null;
  epochs: number;
  accuracy: number | null;
  model: NetworkModel | null;
}

export interface TrainingMission {
  id: number;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  locked: boolean;
  requiredLevel?: number;
  proBadge?: boolean;
  epochs?: number;
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
  date: string;
  accuracy: number;
  points: number;
  mission: string;
  modelData?: NetworkModel;
}

export interface EpochData {
  id: string;
  epochNumber: number;
  batchSize: number;
  completedAt: string;
  trainingTime: number | null;
  loss: number | null;
  accuracy: number | null;
  modelState: NetworkModel | null;
  sessionId: string | null;
}

export interface TickCollectionSettings {
  enabled: boolean;
  batchSize: number;
  lastUpdated: string;
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
  
  async completeTrainingSession(sessionId: string, accuracy: number, model: NetworkModel): Promise<boolean> {
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
    modelData?: NetworkModel;
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
  
  async getTrainingHistory(limit: number = 10): Promise<TrainingHistoryItem[]> {
    if (!this.userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('training_history')
        .select('*')
        .eq('user_id', this.userId)
        .order('date', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        date: item.date,
        accuracy: item.accuracy,
        points: item.points,
        mission: item.mission,
        modelData: item.model_data
      }));
    } catch (error) {
      console.error('Error getting training history:', error);
      return [];
    }
  }
  
  async addEpochs(epochs: number): Promise<number> {
    if (!this.userId) return 0;
    
    try {
      // Get current epochs count
      const availableEpochs = await this.getAvailableEpochs();
      
      // Update epochs in user_epochs table
      const newEpochs = availableEpochs + epochs;
      
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
      const availableEpochs = await this.getAvailableEpochs();
      
      if (availableEpochs < epochs) {
        toast.error(`Not enough epochs available. You have ${availableEpochs} but need ${epochs}.`);
        throw new Error('Not enough epochs available');
      }
      
      // Update epochs in user_epochs table
      const newEpochs = availableEpochs - epochs;
      
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
      const currentEpochs = await this.getAvailableEpochs();
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

  async getUserEpochs(): Promise<{ available: number; total: number }> {
    if (!this.userId) return { available: 0, total: 0 };
    
    try {
      // Get available epochs
      const available = await this.getAvailableEpochs();
      
      // Get total epochs from training history
      const { data, error } = await supabase
        .from('training_sessions')
        .select('epochs')
        .eq('user_id', this.userId);
      
      if (error) throw error;
      
      // Sum up all epochs ever used
      const used = data?.reduce((sum, session) => sum + (session.epochs || 0), 0) || 0;
      const total = available + used;
      
      return { available, total };
    } catch (error) {
      console.error('Error getting user epochs:', error);
      return { available: 0, total: 0 };
    }
  }

  async getLevel(): Promise<number> {
    if (!this.userId) return 1;
    
    try {
      // Get total points from training history
      const { data, error } = await supabase
        .from('training_history')
        .select('points')
        .eq('user_id', this.userId);
      
      if (error) throw error;
      
      // Sum up all points earned
      const totalPoints = data?.reduce((sum, item) => sum + (item.points || 0), 0) || 0;
      
      // Define level thresholds
      const levelThresholds = [
        { level: 1, minPoints: 0, maxPoints: 100 },
        { level: 2, minPoints: 101, maxPoints: 250 },
        { level: 3, minPoints: 251, maxPoints: 500 },
        { level: 4, minPoints: 501, maxPoints: 800 },
        { level: 5, minPoints: 801, maxPoints: 1200 }
      ];
      
      // Find current level based on points
      const currentLevel = levelThresholds.find(
        lt => totalPoints >= lt.minPoints && totalPoints <= lt.maxPoints
      ) || levelThresholds[0];
      
      return currentLevel.level;
    } catch (error) {
      console.error('Error getting user level:', error);
      return 1;
    }
  }

  async saveMissionResult(result: TrainingResult): Promise<boolean> {
    if (!this.userId) return false;
    
    try {
      // Store in training history
      await this.addTrainingHistory({
        accuracy: result.accuracy,
        points: result.points,
        modelData: result.modelData,
        mission: `Mission ${result.missionId}`
      });
      
      return true;
    } catch (error) {
      console.error('Error saving mission result:', error);
      return false;
    }
  }

  async saveEpoch(epochData: {
    epochNumber: number;
    batchSize: number;
    ticks: number[];
    trainingTime?: number;
    loss?: number;
    accuracy?: number;
    modelState?: NetworkModel;
    sessionId?: string;
  }): Promise<string | null> {
    if (!this.userId) return null;
    
    try {
      // First, save the epoch information
      const { data: epochRecord, error: epochError } = await supabase
        .from('epochs')
        .insert({
          user_id: this.userId,
          epoch_number: epochData.epochNumber,
          batch_size: epochData.batchSize,
          completed_at: new Date().toISOString(),
          training_time: epochData.trainingTime || null,
          loss: epochData.loss || null,
          accuracy: epochData.accuracy || null,
          model_state: epochData.modelState || null,
          session_id: epochData.sessionId || null
        })
        .select('id')
        .single();
      
      if (epochError) throw epochError;
      
      // Next, save the epoch's tick data
      const { error: ticksError } = await supabase
        .from('epoch_ticks')
        .insert({
          epoch_id: epochRecord.id,
          ticks: epochData.ticks
        });
      
      if (ticksError) throw ticksError;
      
      return epochRecord.id;
    } catch (error) {
      console.error('Error saving epoch:', error);
      return null;
    }
  }

  async getEpochs(limit: number = 20): Promise<EpochData[]> {
    if (!this.userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('epochs')
        .select('*')
        .eq('user_id', this.userId)
        .order('epoch_number', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        epochNumber: item.epoch_number,
        batchSize: item.batch_size,
        completedAt: item.completed_at,
        trainingTime: item.training_time,
        loss: item.loss,
        accuracy: item.accuracy,
        modelState: item.model_state,
        sessionId: item.session_id
      }));
    } catch (error) {
      console.error('Error getting epochs:', error);
      return [];
    }
  }

  async getEpochTicks(epochId: string): Promise<number[]> {
    if (!this.userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('epoch_ticks')
        .select('ticks')
        .eq('epoch_id', epochId)
        .single();
      
      if (error) throw error;
      
      return data?.ticks || [];
    } catch (error) {
      console.error('Error getting epoch ticks:', error);
      return [];
    }
  }

  async getLatestEpoch(): Promise<EpochData | null> {
    if (!this.userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('epochs')
        .select('*')
        .eq('user_id', this.userId)
        .order('epoch_number', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No records found
          return null;
        }
        throw error;
      }
      
      return {
        id: data.id,
        epochNumber: data.epoch_number,
        batchSize: data.batch_size,
        completedAt: data.completed_at,
        trainingTime: data.training_time,
        loss: data.loss,
        accuracy: data.accuracy,
        modelState: data.model_state,
        sessionId: data.session_id
      };
    } catch (error) {
      console.error('Error getting latest epoch:', error);
      return null;
    }
  }

  async saveTickCollectionSettings(settings: {
    enabled: boolean;
    batchSize: number;
  }): Promise<boolean> {
    if (!this.userId) return false;
    
    try {
      const { error } = await supabase
        .from('tick_collection_settings')
        .upsert({
          user_id: this.userId,
          enabled: settings.enabled,
          batch_size: settings.batchSize,
          last_updated: new Date().toISOString()
        });
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error saving tick collection settings:', error);
      return false;
    }
  }

  async getTickCollectionSettings(): Promise<TickCollectionSettings | null> {
    if (!this.userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('tick_collection_settings')
        .select('*')
        .eq('user_id', this.userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, create default settings
          const defaultSettings = {
            enabled: true,
            batchSize: 100,
            lastUpdated: new Date().toISOString()
          };
          
          await this.saveTickCollectionSettings({
            enabled: defaultSettings.enabled,
            batchSize: defaultSettings.batchSize
          });
          
          return defaultSettings;
        }
        throw error;
      }
      
      return {
        enabled: data.enabled,
        batchSize: data.batch_size,
        lastUpdated: data.last_updated
      };
    } catch (error) {
      console.error('Error getting tick collection settings:', error);
      return null;
    }
  }
}

export const trainingService = new TrainingService();
export default trainingService;
