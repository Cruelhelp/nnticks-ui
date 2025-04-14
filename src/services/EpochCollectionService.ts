
import { BrowserEventEmitter } from '@/lib/utils';
import { persistentWebSocket } from './PersistentWebSocketService';
import { supabase } from '@/lib/supabase';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { EpochData, TickData, TrainingResult, EpochCollectionStatus } from '@/types/chartTypes';
import { toast } from 'sonner';

class EpochCollectionService extends BrowserEventEmitter {
  private userId: string | null = null;
  private tickBuffer: TickData[] = [];
  private batchSize: number = 100;
  private currentEpoch: number = 0;
  private isCollecting: boolean = false;
  private isProcessing: boolean = false;
  private status: EpochCollectionStatus = {
    isActive: false,
    isProcessing: false,
    currentCount: 0,
    targetCount: 100,
    progress: 0
  };
  private tickHandler: ((tick: TickData) => void) | null = null;

  constructor() {
    super();
    this.loadFromLocalStorage();
    
    // Add unload event to save state
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.saveToLocalStorage());
    }
  }

  // Initialize with user ID
  public init(userId: string | null): void {
    this.userId = userId;
    
    if (userId) {
      this.loadSettings();
      this.loadLastEpoch();
    }
    
    this.setupTickHandler();
    console.log('EpochCollectionService initialized with userId:', userId);
  }

  // Load settings from Supabase
  private async loadSettings(): Promise<void> {
    if (!this.userId) return;

    try {
      // Get settings from Supabase
      const { data, error } = await supabase
        .from('tick_collection_settings')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          console.error('Error loading tick collection settings:', error);
        }
        return;
      }

      if (data) {
        this.batchSize = data.batch_size;
        this.isCollecting = data.enabled;
        
        this.status = {
          ...this.status,
          isActive: data.enabled,
          targetCount: data.batch_size
        };
        
        console.log('Loaded settings from Supabase:', data);
        this.emit('statusUpdate', this.status);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  // Load the last epoch from Supabase
  private async loadLastEpoch(): Promise<void> {
    if (!this.userId) return;

    try {
      // Get the latest epoch number
      const { data, error } = await supabase
        .from('epochs')
        .select('epoch_number')
        .eq('user_id', this.userId)
        .order('epoch_number', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          console.error('Error loading last epoch:', error);
        }
        return;
      }

      if (data) {
        this.currentEpoch = data.epoch_number;
        console.log('Loaded last epoch number:', this.currentEpoch);
      }
    } catch (error) {
      console.error('Error loading last epoch:', error);
    }
  }

  // Save settings to Supabase
  private async saveSettings(): Promise<void> {
    if (!this.userId) return;

    try {
      const { error } = await supabase
        .from('tick_collection_settings')
        .upsert({
          user_id: this.userId,
          batch_size: this.batchSize,
          enabled: this.isCollecting,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving tick collection settings:', error);
      } else {
        console.log('Settings saved to Supabase');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Load state from localStorage for resilience
  private loadFromLocalStorage(): void {
    try {
      const savedState = localStorage.getItem('epochCollectionState');
      if (savedState) {
        const state = JSON.parse(savedState);
        this.isCollecting = state.isActive || false;
        this.batchSize = state.batchSize || 100;
        this.currentEpoch = state.currentEpoch || 0;
        this.tickBuffer = state.ticks || [];
        
        this.status = {
          isActive: this.isCollecting,
          isProcessing: false,
          currentCount: this.tickBuffer.length,
          targetCount: this.batchSize,
          progress: (this.tickBuffer.length / this.batchSize) * 100
        };
        
        console.log('Loaded state from localStorage:', state);
        this.emit('statusUpdate', this.status);
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  }

  // Save state to localStorage for resilience
  private saveToLocalStorage(): void {
    try {
      const state = {
        isActive: this.isCollecting,
        batchSize: this.batchSize,
        currentEpoch: this.currentEpoch,
        ticks: this.tickBuffer
      };
      
      localStorage.setItem('epochCollectionState', JSON.stringify(state));
      console.log('Saved state to localStorage');
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  // Set up the WebSocket tick handler
  private setupTickHandler(): void {
    // Remove any existing tick handler
    if (this.tickHandler) {
      persistentWebSocket.off('tick', this.tickHandler);
      this.tickHandler = null;
    }

    // Create new tick handler
    this.tickHandler = (tick: TickData) => {
      if (!this.isCollecting) return;
      
      // Add tick to buffer
      this.tickBuffer.push(tick);
      
      // Update status
      const currentCount = this.tickBuffer.length;
      const progress = (currentCount / this.batchSize) * 100;
      
      this.status = {
        isActive: this.isCollecting,
        isProcessing: this.isProcessing,
        currentCount,
        targetCount: this.batchSize,
        progress
      };
      
      // Emit events
      this.emit('statusUpdate', this.status);
      this.emit('tickCollected', tick);
      
      console.log(`Tick collected. Buffer size: ${currentCount}/${this.batchSize}`);
      
      // Save state periodically (every 10 ticks)
      if (currentCount % 10 === 0) {
        this.saveToLocalStorage();
      }
      
      // If we've collected enough ticks, process the epoch
      if (currentCount >= this.batchSize) {
        this.processEpoch();
      }
    };

    // Add tick handler to WebSocket
    persistentWebSocket.on('tick', this.tickHandler);
    console.log('Tick handler set up');
    
    // Save initial state
    this.saveToLocalStorage();
  }

  // Process an epoch when enough ticks are collected
  private async processEpoch(): Promise<void> {
    if (this.isProcessing || this.tickBuffer.length < this.batchSize) {
      return;
    }
    
    try {
      this.isProcessing = true;
      this.status.isProcessing = true;
      this.emit('statusUpdate', this.status);
      
      // Get batch of ticks for training
      const tickBatch = this.tickBuffer.slice(0, this.batchSize);
      
      // Prepare ticks for training (extract values)
      const tickValues = tickBatch.map(tick => tick.value);
      
      // Train neural network
      console.log(`Training neural network with ${tickValues.length} ticks`);
      const startTime = Date.now();
      
      let trainingResult;
      try {
        trainingResult = await neuralNetwork.train(tickValues, {
          maxEpochs: 10,
          onProgress: (progress) => console.log(`Training progress: ${progress * 100}%`)
        });
      } catch (error) {
        console.error('Error training neural network:', error);
        trainingResult = 0;
      }
      
      const endTime = Date.now();
      const trainingTime = endTime - startTime;
      
      // Prepare result
      const result: TrainingResult = {
        accuracy: typeof trainingResult === 'number' ? trainingResult : 0,
        loss: neuralNetwork.getLastLoss() || 0,
        time: trainingTime
      };
      
      // Increment epoch number
      this.currentEpoch++;
      
      // Create epoch data
      const newEpoch: EpochData = {
        epochNumber: this.currentEpoch,
        startTime: startTime,
        endTime: endTime,
        ticks: [...tickBatch],
        results: result
      };
      
      // Remove processed ticks from buffer
      this.tickBuffer = this.tickBuffer.slice(this.batchSize);
      
      // Save epoch data to Supabase
      await this.saveEpochToSupabase(newEpoch);
      
      // Update status
      this.status = {
        isActive: this.isCollecting,
        isProcessing: false,
        currentCount: this.tickBuffer.length,
        targetCount: this.batchSize,
        progress: (this.tickBuffer.length / this.batchSize) * 100
      };
      
      // Emit events
      this.emit('epochCompleted', newEpoch);
      this.emit('statusUpdate', this.status);
      
      // Save state to localStorage
      this.saveToLocalStorage();
      
      console.log(`Epoch ${this.currentEpoch} completed. Accuracy: ${result.accuracy * 100}%, Loss: ${result.loss}`);
      toast.success(`Epoch ${this.currentEpoch} completed`);
    } catch (error) {
      console.error('Error processing epoch:', error);
      toast.error('Failed to process epoch');
    } finally {
      this.isProcessing = false;
      this.status.isProcessing = false;
      this.emit('statusUpdate', this.status);
    }
  }

  // Save epoch data to Supabase
  private async saveEpochToSupabase(epoch: EpochData): Promise<void> {
    if (!this.userId) return;
    
    try {
      // Export model state
      const modelState = neuralNetwork.exportModel();
      
      // Save epoch to Supabase
      const { error } = await supabase
        .from('epochs')
        .insert({
          user_id: this.userId,
          epoch_number: epoch.epochNumber,
          batch_size: this.batchSize,
          accuracy: epoch.results?.accuracy ? epoch.results.accuracy * 100 : null,
          loss: epoch.results?.loss || null,
          training_time: epoch.results?.time || null,
          model_state: modelState,
          completed_at: new Date(epoch.endTime || Date.now()).toISOString()
        });
      
      if (error) {
        console.error('Error saving epoch to Supabase:', error);
      } else {
        console.log('Epoch saved to Supabase:', epoch.epochNumber);
      }
      
      // Store the ticks for this epoch
      if (epoch.ticks.length > 0) {
        const { error: ticksError } = await supabase
          .from('epoch_ticks')
          .insert({
            epoch_id: epoch.epochNumber.toString(),
            ticks: epoch.ticks
          });
        
        if (ticksError) {
          console.error('Error saving epoch ticks to Supabase:', ticksError);
        } else {
          console.log('Epoch ticks saved to Supabase');
        }
      }
    } catch (error) {
      console.error('Error saving epoch to Supabase:', error);
    }
  }

  // Public methods

  // Start collecting ticks
  public startCollection(): boolean {
    if (!persistentWebSocket.isConnected()) {
      toast.error('WebSocket not connected. Cannot collect ticks.');
      console.error('WebSocket not connected. Cannot collect ticks.');
      return false;
    }
    
    this.isCollecting = true;
    this.status.isActive = true;
    this.emit('statusUpdate', this.status);
    this.saveSettings();
    
    console.log('Epoch collection started');
    toast.success('Epoch collection started');
    return true;
  }

  // Stop collecting ticks
  public stopCollection(): void {
    this.isCollecting = false;
    this.status.isActive = false;
    this.emit('statusUpdate', this.status);
    this.saveSettings();
    
    console.log('Epoch collection paused');
    toast.info('Epoch collection paused');
  }

  // Reset collection (clear buffer)
  public resetCollection(): void {
    this.tickBuffer = [];
    this.status = {
      ...this.status,
      currentCount: 0,
      progress: 0
    };
    this.emit('statusUpdate', this.status);
    this.saveToLocalStorage();
    
    console.log('Epoch collection reset');
    toast.info('Epoch collection reset');
  }

  // Update batch size
  public updateBatchSize(newSize: number): boolean {
    if (isNaN(newSize) || newSize < 10) {
      toast.error('Batch size must be at least 10');
      return false;
    }
    
    this.batchSize = newSize;
    this.status.targetCount = newSize;
    this.status.progress = (this.status.currentCount / newSize) * 100;
    this.emit('statusUpdate', this.status);
    this.saveSettings();
    this.saveToLocalStorage();
    
    console.log(`Batch size updated to ${newSize}`);
    toast.success(`Batch size updated to ${newSize}`);
    return true;
  }

  // Get current status
  public getStatus(): EpochCollectionStatus {
    return { ...this.status };
  }

  // Get batch size
  public getBatchSize(): number {
    return this.batchSize;
  }

  // Get current epoch count
  public getCurrentEpochCount(): number {
    return this.currentEpoch;
  }

  // Clean up (remove event listeners)
  public cleanup(): void {
    if (this.tickHandler) {
      persistentWebSocket.off('tick', this.tickHandler);
    }
    
    this.saveToLocalStorage();
    console.log('EpochCollectionService cleaned up');
  }
}

// Create singleton instance
export const epochCollectionService = new EpochCollectionService();
export default epochCollectionService;
