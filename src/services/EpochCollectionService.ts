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
  private lastEpochErrorToast: number | null = null;
  private lastTickReceivedAt: number | null = null;
  private noTickWarningInterval: NodeJS.Timeout | null = null;

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
    // Always set a valid userId: authenticated user's id or GUEST_USER_ID
    const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000';
    this.userId = userId || GUEST_USER_ID;
    
    if (this.userId) {
      this.loadSettings();
      this.loadLastEpoch();
    }
    
    this.setupTickHandler();
    console.log('EpochCollectionService initialized with userId:', this.userId);
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
    console.log('[EpochCollectionService] Setting up tick handler');
    // Remove any existing tick handler
    if (this.tickHandler) {
      persistentWebSocket.off('tick', this.tickHandler);
      this.tickHandler = null;
    }

    // Create new tick handler
    this.tickHandler = async (tick: TickData) => {
      console.log('[EpochCollectionService] Tick received:', tick);
      if (!this.isCollecting) return;
      
      // Add tick to buffer for epoch logic only if stored successfully
      let tickStored = false;
      if (this.userId) {
        try {
          await supabase.from('ticks').insert({
            user_id: this.userId,
            timestamp: new Date(tick.timestamp).toISOString(),
            price: tick.value,
            market: tick.market || 'unknown',
            tick_data: tick,
          });
          tickStored = true;
        } catch (error) {
          console.error('[EpochCollectionService] Error inserting tick into Supabase:', error);
        }
      }
      if (tickStored) {
        this.tickBuffer.push(tick);
        console.log('[EpochCollectionService] Tick stored and added to buffer. Buffer size:', this.tickBuffer.length);
      }

      // Update status
      const currentCount = this.tickBuffer.length;
      const progress = Math.min(100, Math.max(0, (currentCount / this.batchSize) * 100));
      
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
    console.log('[EpochCollectionService] Tick handler set up');

    // Save initial state
    this.saveToLocalStorage();

    // --- Debug: Warn if no ticks received for >10s ---
    if (this.noTickWarningInterval) {
      clearInterval(this.noTickWarningInterval);
    }
    this.lastTickReceivedAt = Date.now();
    persistentWebSocket.on('tick', () => {
      this.lastTickReceivedAt = Date.now();
    });
    this.noTickWarningInterval = setInterval(() => {
      if (this.isCollecting && Date.now() - this.lastTickReceivedAt > 10000) {
        console.warn('[EpochCollectionService] No ticks received for over 10 seconds!');
        toast.warning('No market ticks received for 10 seconds. Check your connection.');
      }
    }, 5000);
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
      
      // Train model on tickBuffer
      const result = await neuralNetwork.train(this.tickBuffer.map(t => t.value), {
        maxEpochs: 10,
        onProgress: (progress: number) => console.log(`Training progress: ${progress * 100}%`)
      });
      
      // Save epoch to Supabase
      const { data: epochInsert, error: epochError } = await supabase
        .from('epochs')
        .insert({
          user_id: this.userId,
          epoch_number: this.currentEpoch + 1,
          batch_size: this.batchSize,
          accuracy: typeof result === 'number' ? result * 100 : 0,
          loss: neuralNetwork.getLastLoss() || 0,
          training_time: 0,
          model_state: neuralNetwork.exportModel(),
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (epochError) throw epochError;
      
      // Assign epoch_id to last N ticks for this user
      if (epochInsert?.id) {
        await supabase.rpc('assign_ticks_to_epoch', {
          user_id: this.userId,
          epoch_id: epochInsert.id,
          tick_count: this.batchSize
        });
      }
      
      this.currentEpoch += 1;
      this.tickBuffer = [];
      this.status = {
        ...this.status,
        currentCount: 0,
        progress: 0
      };
      
      this.emit('epochCompleted', {
        epochNumber: this.currentEpoch,
        startTime: Date.now(),
        endTime: Date.now(),
        ticks: [],
        results: result
      });
      
      this.emit('statusUpdate', this.status);
      this.saveToLocalStorage();
      toast.success(`Epoch ${this.currentEpoch} completed`);
    } catch (error) {
      // Prevent spamming error toasts
      if (!this.lastEpochErrorToast || Date.now() - this.lastEpochErrorToast > 5000) {
        toast.error('Failed to process epoch');
        this.lastEpochErrorToast = Date.now();
      }
      console.error('Error processing epoch:', error);
    } finally {
      this.isProcessing = false;
      this.status.isProcessing = false;
      this.emit('statusUpdate', this.status);
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
