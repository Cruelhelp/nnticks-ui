import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { webSocketService, TickData } from '@/services/WebSocketService';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { trainingService } from '@/services/TrainingService';

export interface EpochProgressStatus {
  active: boolean;
  currentCount: number;
  targetCount: number;
  progress: number;
  epochsCompleted: number;
  isProcessing: boolean;
  error?: string; // Added error property
}

class EpochService {
  private userId: string | null = null;
  private tickBuffer: TickData[] = [];
  private currentTicks: TickData[] = []; // Added currentTicks
  private batchSize: number = 100;
  private epochNumber: number = 0;
  private isActive: boolean = false;
  private isProcessing: boolean = false;
  private lastSavedModelState: any = null;
  private listeners: {[key: string]: ((status: EpochProgressStatus) => void)[]} = {};
  private sessionId: string | null = null;

  constructor() {
    // Set up WebSocket event listener for ticks
    webSocketService.on('tick', this.handleNewTick.bind(this));

    // Try to restore state from local storage on initialization
    this.restoreStateFromLocalStorage();
  }

  setUserId(userId: string | null) {
    this.userId = userId;

    if (userId) {
      this.loadPersistedState();
    } else {
      this.reset();
    }
  }

  async start(batchSize: number = 100): Promise<boolean> {
    if (!this.userId) {
      toast.error('You must be logged in to start epoch collection');
      return false;
    }

    try {
      // Save settings to Supabase
      await trainingService.saveTickCollectionSettings({
        enabled: true,
        batchSize
      });

      // Start a new training session if none exists
      if (!this.sessionId) {
        this.sessionId = await trainingService.startTrainingSession(1000); // Default to 1000 epochs
      }

      this.batchSize = batchSize;
      this.isActive = true;

      // Make sure WebSocket is connected
      if (!webSocketService.isConnected()) {
        webSocketService.connect();
      }

      this.saveStateToLocalStorage();
      this.notifyListeners();

      toast.success('Epoch collection started');
      return true;
    } catch (error) {
      console.error('Error starting epoch collection:', error);
      toast.error('Failed to start epoch collection');
      return false;
    }
  }

  stop(): void {
    this.isActive = false;

    // Save settings to Supabase
    if (this.userId) {
      trainingService.saveTickCollectionSettings({
        enabled: false,
        batchSize: this.batchSize
      });
    }

    this.saveStateToLocalStorage();
    this.notifyListeners();

    toast.info('Epoch collection stopped');
  }

  reset(): void {
    this.tickBuffer = [];
    this.currentTicks = []; // Added reset for currentTicks
    this.batchSize = 100;
    this.epochNumber = 0;
    this.isActive = false;
    this.isProcessing = false;
    this.lastSavedModelState = null;
    this.sessionId = null;

    localStorage.removeItem('epochServiceState');
    this.notifyListeners();

    toast.info('Epoch collection reset');
  }

  getStatus(): EpochProgressStatus {
    return {
      active: this.isActive,
      currentCount: this.tickBuffer.length,
      targetCount: this.batchSize,
      progress: (this.tickBuffer.length / this.batchSize) * 100,
      epochsCompleted: this.epochNumber,
      isProcessing: this.isProcessing,
      error: undefined // Initialize error to undefined
    };
  }

  subscribe(id: string, callback: (status: EpochProgressStatus) => void): void {
    if (!this.listeners[id]) {
      this.listeners[id] = [];
    }
    this.listeners[id].push(callback);

    // Call immediately with current status
    callback(this.getStatus());
  }

  unsubscribe(id: string): void {
    delete this.listeners[id];
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    Object.values(this.listeners).forEach(callbacks => {
      callbacks.forEach(callback => callback(status));
    });
  }

  private async handleNewTick(tick: TickData): Promise<void> {
    if (!this.isActive || this.isProcessing) return;

    // Add tick to buffer
    this.tickBuffer.push(tick);
    this.currentTicks.push(tick); // Added to currentTicks

    // Save state to localStorage for resilience
    this.saveStateToLocalStorage();

    // Notify listeners about the new status
    this.notifyListeners();

    // Check if we have enough ticks to complete an epoch
    if (this.tickBuffer.length >= this.batchSize) {
      await this.processEpoch();
    }
  }

  private async processEpoch(): Promise<void> {
    if (this.isProcessing || this.currentTicks.length < this.batchSize) {
      return;
    }

    try {
      this.isProcessing = true;
      const status = this.getStatus();
      status.isProcessing = true;
      this.notifyListeners();


      // Start new session if none exists
      if (!this.sessionId) {
        this.sessionId = await trainingService.startTrainingSession(this.epochNumber + 1);
      }

      // Prepare ticks for training
      const tickValues = this.currentTicks.map(tick => tick.value);

      // Train neural network using Python backend
      console.log(`Training neural network with ${tickValues.length} ticks`);
      const startTime = Date.now();

      const response = await fetch('http://localhost:5000/api/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ticks: tickValues,
          sessionId: this.sessionId
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      // Save epoch results
      await trainingService.saveEpoch({
        epochNumber: this.epochNumber,
        batchSize: this.batchSize,
        ticks: this.currentTicks,
        trainingTime: Date.now() - startTime,
        loss: result.result.loss,
        accuracy: result.result.accuracy,
        sessionId: this.sessionId
      });

      // Reset progress
      this.currentTicks = [];
      this.epochNumber++;

      // Reset session after significant progress
      if (this.epochNumber % 10 === 0) {
        await trainingService.completeTrainingSession(this.sessionId, result.result.accuracy, result.result.model);
        this.sessionId = null;
      }

    } catch (error) {
      console.error('Error processing epoch:', error);
      const status = this.getStatus();
      status.error = error.message;
      this.notifyListeners();
    } finally {
      this.isProcessing = false;
      const status = this.getStatus();
      status.isProcessing = false;
      this.notifyListeners();
    }
  }

  private saveStateToLocalStorage(): void {
    const state = {
      tickBuffer: this.tickBuffer.length > 0 ? this.tickBuffer.slice(-50) : [], // Save only last 50 ticks to avoid size issues
      currentTicks: this.currentTicks, // Added currentTicks to state
      batchSize: this.batchSize,
      epochNumber: this.epochNumber,
      isActive: this.isActive,
      lastSavedModelState: this.lastSavedModelState,
      sessionId: this.sessionId,
      userId: this.userId
    };

    localStorage.setItem('epochServiceState', JSON.stringify(state));
  }

  private restoreStateFromLocalStorage(): void {
    try {
      const savedState = localStorage.getItem('epochServiceState');
      if (savedState) {
        const state = JSON.parse(savedState);

        // Only restore if user ID matches (important for security)
        if (state.userId === this.userId || !this.userId) {
          this.tickBuffer = state.tickBuffer || [];
          this.currentTicks = state.currentTicks || []; // Restore currentTicks
          this.batchSize = state.batchSize || 100;
          this.epochNumber = state.epochNumber || 0;
          this.isActive = !!state.isActive;
          this.lastSavedModelState = state.lastSavedModelState;
          this.sessionId = state.sessionId;

          // If we have a saved model state, restore it to the neural network
          if (this.lastSavedModelState) {
            neuralNetwork.importModel(this.lastSavedModelState);
          }

          console.log('Restored epoch service state from local storage');
        }
      }
    } catch (error) {
      console.error('Error restoring state from local storage:', error);
    }
  }

  private async loadPersistedState(): Promise<void> {
    if (!this.userId) return;

    try {
      // Get tick collection settings
      const settings = await trainingService.getTickCollectionSettings();
      if (settings) {
        this.batchSize = settings.batchSize;
        this.isActive = settings.enabled;
      }

      // Get the latest epoch
      const latestEpoch = await trainingService.getLatestEpoch();
      if (latestEpoch) {
        this.epochNumber = latestEpoch.epochNumber;

        // Restore model state if available
        if (latestEpoch.modelState) {
          this.lastSavedModelState = latestEpoch.modelState;
          neuralNetwork.importModel(latestEpoch.modelState);
        }
      }

      this.saveStateToLocalStorage();
      this.notifyListeners();
    } catch (error) {
      console.error('Error loading persisted state:', error);
    }
  }

  getLatestModelState(): any {
    return this.lastSavedModelState;
  }

  async getTickBatchSize(): Promise<number> {
    if (!this.userId) return this.batchSize;

    try {
      const settings = await trainingService.getTickCollectionSettings();
      if (settings) {
        this.batchSize = settings.batchSize;
      }
      return this.batchSize;
    } catch (error) {
      console.error('Error getting tick batch size:', error);
      return this.batchSize;
    }
  }

  async updateTickBatchSize(newBatchSize: number): Promise<boolean> {
    if (!this.userId) {
      this.batchSize = newBatchSize;
      this.saveStateToLocalStorage();
      this.notifyListeners();
      return true;
    }

    try {
      const success = await trainingService.saveTickCollectionSettings({
        enabled: this.isActive,
        batchSize: newBatchSize
      });

      if (success) {
        this.batchSize = newBatchSize;
        this.saveStateToLocalStorage();
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating tick batch size:', error);
      return false;
    }
  }
}

export const epochService = new EpochService();
export default epochService;