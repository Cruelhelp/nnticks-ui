import { persistentWebSocket, TickData } from './PersistentWebSocketService';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface EpochCollectionStatus {
  active: boolean;
  currentCount: number;
  progress: number;
  epochsCompleted: number;
  isProcessing: boolean;
  lastCompleted: string | null;
  subscription: string;
}

// Default status
const DEFAULT_STATUS: EpochCollectionStatus = {
  active: false,
  currentCount: 0,
  progress: 0,
  epochsCompleted: 0,
  isProcessing: false,
  lastCompleted: null,
  subscription: 'R_10'
};

class EpochCollectionService {
  private userId: string | null = null;
  private status: EpochCollectionStatus = { ...DEFAULT_STATUS };
  private tickBatchSize: number = 100;
  private currentBatch: TickData[] = [];
  private subscribers: Map<string, (status: EpochCollectionStatus) => void> = new Map();
  private initialized: boolean = false;
  private isLoadingSettings: boolean = false;
  private tickHandler: ((tick: TickData) => void) | null = null;
  
  constructor() {
    // Bind methods
    this.handleTick = this.handleTick.bind(this);
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the service
   */
  private async init(): Promise<void> {
    if (this.initialized) return;
    
    // Load saved status from localStorage
    const savedStatus = localStorage.getItem('epochCollectionStatus');
    if (savedStatus) {
      try {
        const parsedStatus = JSON.parse(savedStatus);
        this.status = { ...this.status, ...parsedStatus };
      } catch (error) {
        console.error('Error parsing saved epoch collection status:', error);
      }
    }
    
    this.initialized = true;
  }
  
  /**
   * Set user ID
   */
  public setUserId(userId: string | null): void {
    if (this.userId === userId) return;
    
    const prevUserId = this.userId;
    this.userId = userId;
    
    // If user ID changed, reset and load settings
    if (prevUserId !== userId) {
      this.reset();
      this.loadUserSettings();
    }
  }
  
  /**
   * Load user settings from Supabase
   */
  private async loadUserSettings(): Promise<void> {
    if (!this.userId || this.isLoadingSettings) return;
    
    this.isLoadingSettings = true;
    
    try {
      // Load batch size from tick_collection_settings
      const { data, error } = await supabase
        .from('tick_collection_settings')
        .select('*')
        .eq('user_id', this.userId)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error loading tick collection settings:', error);
        }
        
        // No settings found, create default settings
        if (error.code === 'PGRST116') {
          await this.createDefaultSettings();
        }
      } else if (data) {
        this.tickBatchSize = data.batch_size;
        this.status.active = data.enabled;
        this.updateSubscribers();
      }
      
      // Load epochs completed
      await this.loadEpochsCompleted();
      
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      this.isLoadingSettings = false;
    }
  }
  
  /**
   * Create default settings in Supabase
   */
  private async createDefaultSettings(): Promise<void> {
    if (!this.userId) return;
    
    try {
      const { error } = await supabase
        .from('tick_collection_settings')
        .insert({
          user_id: this.userId,
          batch_size: this.tickBatchSize,
          enabled: this.status.active
        });
      
      if (error) {
        console.error('Error creating default tick collection settings:', error);
      }
    } catch (error) {
      console.error('Error creating default settings:', error);
    }
  }
  
  /**
   * Load epochs completed from Supabase
   */
  private async loadEpochsCompleted(): Promise<void> {
    if (!this.userId) return;
    
    try {
      const { count, error } = await supabase
        .from('epochs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId);
      
      if (error) {
        if (!error.message.includes('does not exist')) {
          console.error('Error loading epochs count:', error);
        }
      } else if (count !== null) {
        this.status.epochsCompleted = count;
        this.updateSubscribers();
      }
    } catch (error) {
      console.error('Error loading epochs completed:', error);
    }
  }
  
  /**
   * Start epoch collection
   */
  public async start(batchSize?: number): Promise<boolean> {
    if (!this.userId) {
      toast.error('You must be logged in to start epoch collection');
      return false;
    }
    
    // If batch size is provided, update it
    if (batchSize !== undefined) {
      await this.updateTickBatchSize(batchSize);
    }
    
    console.log('[EpochCollectionService] Starting epoch collection with batch size:', this.tickBatchSize);
    
    // Clear current batch if stopping and starting again
    if (!this.status.active) {
      this.currentBatch = [];
    }
    
    // Update status
    this.status.active = true;
    this.updateStatus();
    
    // Start listening for ticks
    if (!this.tickHandler) {
      this.tickHandler = this.handleTick;
      persistentWebSocket.on('tick', this.tickHandler);
    }
    
    try {
      // Update settings in Supabase
      if (this.userId) {
        const { error } = await supabase
          .from('tick_collection_settings')
          .upsert({
            user_id: this.userId,
            enabled: true,
            batch_size: this.tickBatchSize,
            last_updated: new Date().toISOString()
          });
        
        if (error) {
          console.error('Error updating tick collection settings:', error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error starting epoch collection:', error);
      return false;
    }
  }
  
  /**
   * Stop epoch collection
   */
  public async stop(): Promise<void> {
    console.log('[EpochCollectionService] Stopping epoch collection');
    
    // Update status
    this.status.active = false;
    this.updateStatus();
    
    // Keep listening for ticks but don't process them for epochs
    
    try {
      // Update settings in Supabase
      if (this.userId) {
        const { error } = await supabase
          .from('tick_collection_settings')
          .upsert({
            user_id: this.userId,
            enabled: false,
            batch_size: this.tickBatchSize,
            last_updated: new Date().toISOString()
          });
        
        if (error) {
          console.error('Error updating tick collection settings:', error);
        }
      }
    } catch (error) {
      console.error('Error stopping epoch collection:', error);
    }
  }
  
  /**
   * Reset epoch collection
   */
  public reset(): void {
    // Stop collection
    this.stop();
    
    // Reset status
    this.status = { ...DEFAULT_STATUS };
    this.currentBatch = [];
    
    // Remove event listeners
    if (this.tickHandler) {
      persistentWebSocket.off('tick', this.tickHandler);
      this.tickHandler = null;
    }
    
    // Update subscribers
    this.updateSubscribers();
  }
  
  /**
   * Handle tick data
   */
  private handleTick(tick: TickData): void {
    // Only process ticks if active
    if (!this.status.active) return;
    
    // Add tick to current batch
    this.currentBatch.push(tick);
    
    // Update status
    this.status.currentCount = this.currentBatch.length;
    this.status.progress = (this.currentBatch.length / this.tickBatchSize) * 100;
    
    // Update the market in the status
    this.status.subscription = tick.market;
    
    // Process batch if complete
    if (this.currentBatch.length >= this.tickBatchSize) {
      this.processBatch();
    }
    
    // Update subscribers
    this.updateSubscribers();
  }
  
  /**
   * Process completed batch
   */
  private async processBatch(): Promise<void> {
    // Mark as processing
    this.status.isProcessing = true;
    this.updateSubscribers();
    
    console.log(`[EpochCollectionService] Processing batch of ${this.currentBatch.length} ticks`);
    
    try {
      // Train neural network with batch
      const normalizedData = this.currentBatch.map(tick => tick.value);
      
      // Simple normalized data for the neural network
      const trainingResult = await neuralNetwork.train(normalizedData);
      
      console.log('[EpochCollectionService] Training result:', trainingResult);
      
      // Store epoch in Supabase
      if (this.userId) {
        const epochNumber = this.status.epochsCompleted + 1;
        
        const epochData = {
          user_id: this.userId,
          epoch_number: epochNumber,
          batch_size: this.currentBatch.length,
          loss: trainingResult.loss || 0,
          accuracy: trainingResult.accuracy || 0,
          training_time: trainingResult.time || 0,
          model_state: neuralNetwork.exportModel()
        };
        
        // Store epoch
        const { data: epoch, error: epochError } = await supabase
          .from('epochs')
          .insert(epochData)
          .select()
          .single();
        
        if (epochError) {
          console.error('Error storing epoch:', epochError);
        } else if (epoch) {
          console.log('[EpochCollectionService] Epoch stored:', epoch.id);
          
          // Store tick data for the epoch
          const { error: ticksError } = await supabase
            .from('epoch_ticks')
            .insert({
              epoch_id: epoch.id,
              ticks: this.currentBatch
            });
          
          if (ticksError) {
            console.error('Error storing epoch ticks:', ticksError);
          }
        }
      }
      
      // Update status
      this.status.epochsCompleted++;
      this.status.lastCompleted = new Date().toISOString();
      
      // Clear batch
      this.currentBatch = [];
      this.status.currentCount = 0;
      this.status.progress = 0;
      
    } catch (error) {
      console.error('Error processing batch:', error);
      toast.error('Error processing epoch batch');
      
      // Clear half the batch to avoid getting stuck
      this.currentBatch = this.currentBatch.slice(this.currentBatch.length / 2);
      this.status.currentCount = this.currentBatch.length;
      this.status.progress = (this.currentBatch.length / this.tickBatchSize) * 100;
    } finally {
      // Mark as done processing
      this.status.isProcessing = false;
      this.updateSubscribers();
    }
  }
  
  /**
   * Update tick batch size
   */
  public async updateTickBatchSize(newSize: number): Promise<boolean> {
    if (newSize < 10) {
      toast.error('Batch size must be at least 10');
      return false;
    }
    
    if (newSize > 1000) {
      toast.error('Batch size must be at most 1000');
      return false;
    }
    
    console.log(`[EpochCollectionService] Updating batch size from ${this.tickBatchSize} to ${newSize}`);
    
    this.tickBatchSize = newSize;
    
    // Update status
    this.status.progress = (this.currentBatch.length / this.tickBatchSize) * 100;
    this.updateSubscribers();
    
    try {
      // Update settings in Supabase
      if (this.userId) {
        const { error } = await supabase
          .from('tick_collection_settings')
          .upsert({
            user_id: this.userId,
            batch_size: newSize,
            last_updated: new Date().toISOString()
          });
        
        if (error) {
          console.error('Error updating tick batch size:', error);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating tick batch size:', error);
      return false;
    }
  }
  
  /**
   * Get current status
   */
  public getStatus(): EpochCollectionStatus {
    return { ...this.status };
  }
  
  /**
   * Get tick batch size
   */
  public getTickBatchSize(): number {
    return this.tickBatchSize;
  }
  
  /**
   * Subscribe to status updates
   */
  public subscribe(id: string, callback: (status: EpochCollectionStatus) => void): void {
    this.subscribers.set(id, callback);
    callback(this.getStatus());
  }
  
  /**
   * Unsubscribe from status updates
   */
  public unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }
  
  /**
   * Update status and save to localStorage
   */
  private updateStatus(): void {
    // Save to localStorage
    localStorage.setItem('epochCollectionStatus', JSON.stringify(this.status));
    
    // Update subscribers
    this.updateSubscribers();
  }
  
  /**
   * Update all subscribers with current status
   */
  private updateSubscribers(): void {
    const status = this.getStatus();
    this.subscribers.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in epoch collection subscriber callback:', error);
      }
    });
  }
}

// Create singleton instance
export const epochCollectionService = new EpochCollectionService();
export default epochCollectionService;
