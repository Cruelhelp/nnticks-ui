import { BrowserEventEmitter } from '@/lib/utils';
import { persistentWebSocket } from './PersistentWebSocketService';
import { supabase } from '@/lib/supabase';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { EpochData, TickData, TrainingResult, EpochCollectionStatus } from '@/types/chartTypes';
import { toast } from 'sonner';

class EpochCollectionService extends BrowserEventEmitter {
  private userId: string | null = null;
  private epochs: EpochData[] = [];
  private currentEpoch: number = 0;
  private isCollectingData: boolean = false;
  private isProcessing: boolean = false;
  private batchSize: number = 100;
  private currentTicks: TickData[] = [];
  private status: EpochCollectionStatus = {
    isActive: false,
    isProcessing: false,
    currentCount: 0,
    targetCount: 100,
    progress: 0
  };
  private tickHandler: ((tick: TickData) => void) | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

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
    this.loadSettings();
    this.setupTickHandler();
  }

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
        this.isCollectingData = data.enabled;
        
        this.status = {
          ...this.status,
          isActive: data.enabled,
          targetCount: data.batch_size
        };
        
        this.emit('statusUpdate', this.status);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    if (!this.userId) return;

    try {
      const { error } = await supabase
        .from('tick_collection_settings')
        .upsert({
          user_id: this.userId,
          batch_size: this.batchSize,
          enabled: this.isCollectingData,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving tick collection settings:', error);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const savedState = localStorage.getItem('epochCollectionState');
      if (savedState) {
        const state = JSON.parse(savedState);
        this.isCollectingData = state.isActive || false;
        this.batchSize = state.batchSize || 100;
        this.currentEpoch = state.currentEpoch || 0;
        this.currentTicks = state.currentTicks || [];
        
        this.status = {
          isActive: this.isCollectingData,
          isProcessing: false,
          currentCount: this.currentTicks.length,
          targetCount: this.batchSize,
          progress: (this.currentTicks.length / this.batchSize) * 100
        };
        
        this.emit('statusUpdate', this.status);
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  }

  private saveToLocalStorage(): void {
    try {
      const state = {
        isActive: this.isCollectingData,
        batchSize: this.batchSize,
        currentEpoch: this.currentEpoch,
        currentTicks: this.currentTicks
      };
      
      localStorage.setItem('epochCollectionState', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  private setupTickHandler(): void {
    // Remove any existing tick handler
    if (this.tickHandler) {
      persistentWebSocket.off('tick', this.tickHandler);
      this.tickHandler = null;
    }

    // Create new tick handler
    this.tickHandler = (tick: TickData) => {
      if (!this.isCollectingData) return;
      
      this.currentTicks.push(tick);
      const currentCount = this.currentTicks.length;
      const progress = (currentCount / this.batchSize) * 100;
      
      this.status = {
        isActive: this.isCollectingData,
        isProcessing: this.isProcessing,
        currentCount,
        targetCount: this.batchSize,
        progress
      };
      
      this.emit('statusUpdate', this.status);
      this.emit('tickCollected', tick);
      
      // If we've collected enough ticks, process the epoch
      if (currentCount >= this.batchSize) {
        this.processEpoch();
      }
    };

    // Add tick handler to WebSocket
    persistentWebSocket.on('tick', this.tickHandler);
    
    // Start synchronization interval
    this.startSyncInterval();
  }

  private startSyncInterval(): void {
    // Clear any existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Set up new interval to periodically sync state
    this.syncInterval = setInterval(() => {
      this.saveToLocalStorage();
      this.saveSettings();
      this.emit('statusUpdate', this.status);
    }, 5000);
  }

  private async processEpoch(): Promise<void> {
    if (this.isProcessing || this.currentTicks.length < this.batchSize) {
      return;
    }
    
    try {
      this.isProcessing = true;
      this.status.isProcessing = true;
      this.emit('statusUpdate', this.status);
      
      // Prepare ticks for training
      const tickValues = this.currentTicks.map(tick => tick.value);
      
      // Train neural network
      console.log(`Training neural network with ${tickValues.length} ticks`);
      const startTime = Date.now();
      
      const loss = await neuralNetwork.train(tickValues, {
        maxEpochs: 10,
        onProgress: (progress) => console.log(`Training progress: ${progress * 100}%`)
      });
      
      const endTime = Date.now();
      const trainingTime = endTime - startTime;
      
      // Prepare result
      const result: TrainingResult = {
        accuracy: Math.max(0, 1 - (loss || 0)), // Convert loss to accuracy
        loss: loss || 0,
        time: trainingTime
      };
      
      // Create epoch data
      const newEpoch: EpochData = {
        epochNumber: ++this.currentEpoch,
        startTime: startTime,
        endTime: endTime,
        ticks: [...this.currentTicks],
        results: result
      };
      
      // Save epoch data
      this.epochs.push(newEpoch);
      await this.saveEpochToSupabase(newEpoch);
      
      // Clear current ticks
      this.currentTicks = [];
      
      // Update status
      this.status = {
        isActive: this.isCollectingData,
        isProcessing: false,
        currentCount: 0,
        targetCount: this.batchSize,
        progress: 0
      };
      
      this.emit('epochCompleted', newEpoch);
      this.emit('statusUpdate', this.status);
      
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

  private async saveEpochToSupabase(epoch: EpochData): Promise<void> {
    if (!this.userId) return;
    
    try {
      const modelState = neuralNetwork.exportModel();
      
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
        }
      }
    } catch (error) {
      console.error('Error saving epoch to Supabase:', error);
    }
  }

  // Public methods
  public startCollection(): boolean {
    if (!persistentWebSocket.isConnected()) {
      toast.error('WebSocket not connected. Cannot collect ticks.');
      return false;
    }
    
    this.isCollectingData = true;
    this.status.isActive = true;
    this.emit('statusUpdate', this.status);
    this.saveSettings();
    toast.success('Epoch collection started');
    return true;
  }

  public stopCollection(): void {
    this.isCollectingData = false;
    this.status.isActive = false;
    this.emit('statusUpdate', this.status);
    this.saveSettings();
    toast.info('Epoch collection paused');
  }

  public resetCollection(): void {
    this.currentTicks = [];
    this.status = {
      ...this.status,
      currentCount: 0,
      progress: 0
    };
    this.emit('statusUpdate', this.status);
    toast.info('Epoch collection reset');
  }

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
    toast.success(`Batch size updated to ${newSize}`);
    return true;
  }

  public getStatus(): EpochCollectionStatus {
    return { ...this.status };
  }

  public getBatchSize(): number {
    return this.batchSize;
  }

  public getCurrentEpochCount(): number {
    return this.currentEpoch;
  }

  public getEpochs(): EpochData[] {
    return [...this.epochs];
  }

  public cleanup(): void {
    if (this.tickHandler) {
      persistentWebSocket.off('tick', this.tickHandler);
    }
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.saveToLocalStorage();
  }
}

// Create singleton instance
export const epochCollectionService = new EpochCollectionService();
export default epochCollectionService;
