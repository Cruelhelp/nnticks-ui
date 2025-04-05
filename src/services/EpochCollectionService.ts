import { EventEmitter } from 'events';
import { supabase } from '@/lib/supabase';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { TickData } from '@/types/chartTypes';

export interface EpochCollectionStatus {
  active: boolean;
  progress: number;
  epochsCompleted: number;
  currentCount: number;
  isProcessing: boolean;
}

interface ModelTrainingResults {
  loss: number;
  accuracy: number;
  time: number;
}

class EpochCollectionService extends EventEmitter {
  private userId: string | null = null;
  private active: boolean = false;
  private tickBuffer: TickData[] = [];
  private tickBatchSize: number = 100;
  private currentCount: number = 0;
  private epochsCompleted: number = 0;
  private progress: number = 0;
  private isProcessing: boolean = false;
  private lastTickTime: number = 0;
  private status: EpochCollectionStatus = {
    active: false,
    progress: 0,
    epochsCompleted: 0,
    currentCount: 0,
    isProcessing: false
  };
  
  constructor() {
    super();
    this.loadTickBatchSize();
    this.loadEpochsCompleted();
  }
  
  // Set the user ID
  public setUserId(userId: string | null): void {
    this.userId = userId;
  }
  
  // Load the tick batch size from local storage
  private loadTickBatchSize(): void {
    const storedBatchSize = localStorage.getItem('tickBatchSize');
    if (storedBatchSize) {
      this.tickBatchSize = parseInt(storedBatchSize, 10);
    }
  }
  
  // Load the epochs completed from local storage
  private loadEpochsCompleted(): void {
    const storedEpochsCompleted = localStorage.getItem('epochsCompleted');
    if (storedEpochsCompleted) {
      this.epochsCompleted = parseInt(storedEpochsCompleted, 10);
      this.status.epochsCompleted = this.epochsCompleted;
    }
  }
  
  // Get the current status
  public getStatus(): EpochCollectionStatus {
    return this.status;
  }
  
  // Get the tick batch size
  public getTickBatchSize(): number {
    return this.tickBatchSize;
  }
  
  // Update the tick batch size
  public async updateTickBatchSize(newBatchSize: number): Promise<boolean> {
    if (newBatchSize < 10 || newBatchSize > 1000) {
      console.error('Invalid batch size:', newBatchSize);
      return false;
    }
    
    this.tickBatchSize = newBatchSize;
    localStorage.setItem('tickBatchSize', newBatchSize.toString());
    return true;
  }
  
  // Start epoch collection
  public async start(batchSize: number = this.tickBatchSize): Promise<boolean> {
    if (!this.userId) {
      console.error('User ID not set');
      return false;
    }
    
    if (this.active) {
      console.warn('Epoch collection already active');
      return true;
    }
    
    this.active = true;
    this.tickBatchSize = batchSize;
    this.tickBuffer = [];
    this.currentCount = 0;
    this.progress = 0;
    this.isProcessing = false;
    
    this.updateStatus();
    
    console.log('Epoch collection started');
    return true;
  }
  
  // Stop epoch collection
  public stop(): void {
    if (!this.active) {
      console.warn('Epoch collection not active');
      return;
    }
    
    this.active = false;
    this.updateStatus();
    
    console.log('Epoch collection stopped');
  }
  
  // Reset epoch collection
  public reset(): void {
    this.stop();
    this.tickBuffer = [];
    this.currentCount = 0;
    this.epochsCompleted = 0;
    this.progress = 0;
    this.isProcessing = false;
    
    localStorage.removeItem('epochsCompleted');
    
    this.updateStatus();
    
    console.log('Epoch collection reset');
  }
  
  // Add a tick to the buffer
  public async addTick(tick: TickData): Promise<void> {
    if (!this.active) return;
    
    this.tickBuffer.push(tick);
    this.currentCount++;
    this.updateProgress();
    this.lastTickTime = Date.now();
    
    if (this.tickBuffer.length >= this.tickBatchSize) {
      await this.processEpoch();
    }
  }
  
  // Process an epoch
  private async processEpoch(): Promise<void> {
    if (this.isProcessing) {
      console.warn('Already processing an epoch');
      return;
    }
    
    this.isProcessing = true;
    this.updateStatus();
    
    console.log('Processing epoch...');
    
    try {
      // Convert tick buffer to array of values
      const tickValues = this.tickBuffer.map(tick => tick.value);
      
      // Train the neural network
      const trainingResults = await neuralNetwork.train(tickValues);
      
      // Store the epoch data
      const epochId = await this.storeEpochData(tickValues);
      
      if (epochId) {
        // Store the training results
        await this.storeEpochResults(epochId, trainingResults);
        
        // Increment the epochs completed
        this.epochsCompleted++;
        localStorage.setItem('epochsCompleted', this.epochsCompleted.toString());
        
        // Reset the tick buffer
        this.tickBuffer = [];
        this.currentCount = 0;
        this.updateProgress();
        this.updateStatus();
        
        console.log('Epoch processed successfully');
      } else {
        console.error('Failed to store epoch data');
      }
    } catch (error) {
      console.error('Error processing epoch:', error);
    } finally {
      this.isProcessing = false;
      this.updateStatus();
    }
  }
  
  // Store epoch data in Supabase
  private async storeEpochData(tickValues: number[]): Promise<string | null> {
    if (!this.userId) {
      console.error('User ID not set');
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('epochs')
        .insert([
          {
            user_id: this.userId,
            ticks: tickValues,
            created_at: new Date().toISOString()
          }
        ])
        .select('id');
      
      if (error) {
        throw error;
      }
      
      return data && data.length > 0 ? data[0].id : null;
    } catch (error) {
      console.error('Error storing epoch data:', error);
      return null;
    }
  }
  
  // Store epoch results in Supabase
  private async storeEpochResults(epochId: string, trainingResults: ModelTrainingResults): Promise<boolean> {
    // Now I can safely use these properties
    const { loss, accuracy, time } = trainingResults;
    
    // Store in Supabase or use locally
    try {
      await supabase.from('epochs').update({
        loss,
        accuracy,
        training_time: time
      }).eq('id', epochId);
      
      return true;
    } catch (error) {
      console.error('Error storing epoch results:', error);
      return false;
    }
  }
  
  // Update the progress
  private updateProgress(): void {
    this.progress = Math.min((this.tickBuffer.length / this.tickBatchSize) * 100, 100);
  }
  
  // Update the status and emit an event
  private updateStatus(): void {
    this.status = {
      active: this.active,
      progress: this.progress,
      epochsCompleted: this.epochsCompleted,
      currentCount: this.currentCount,
      isProcessing: this.isProcessing
    };
    
    this.emit('update', this.status);
  }
}

export const epochCollectionService = new EpochCollectionService();
