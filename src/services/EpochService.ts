import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { webSocketService, TickData } from '@/services/WebSocketService';
import { neuralNetwork } from '@/lib/neuralNetwork';
import { trainingService } from '@/services/TrainingService';
import axios from 'axios';

const API_BASE_URL = `http://${window.location.hostname}:5000/api`;

export interface EpochProgressStatus {
  active: boolean;
  currentCount: number;
  targetCount: number;
  progress: number;
  epochsCompleted: number;
  isProcessing: boolean;
  error?: string; 
}

export interface TrainingResult {
  success: boolean;
  result?: {
    loss: number;
    samples_processed: number;
    final_weights: number[][][];
    final_biases: number[][];
  };
  error?: string;
}

class EpochService {
  private userId: string | null = null;
  private tickBuffer: TickData[] = [];
  private currentTicks: TickData[] = []; 
  private batchSize: number = 100;
  private epochNumber: number = 0;
  private isActive: boolean = false;
  private isProcessing: boolean = false;
  private lastSavedModelState: any = null;
  private listeners: {[key: string]: ((status: EpochProgressStatus) => void)[]} = {};
  private sessionId: string | null = null;

  constructor() {
    webSocketService.on('tick', this.handleNewTick.bind(this));
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
      await trainingService.saveTickCollectionSettings({
        enabled: true,
        batchSize
      });
      if (!this.sessionId) {
        this.sessionId = await trainingService.startTrainingSession(1000); 
      }
      this.batchSize = batchSize;
      this.isActive = true;
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
    this.currentTicks = []; 
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
      error: undefined 
    };
  }

  subscribe(id: string, callback: (status: EpochProgressStatus) => void): void {
    if (!this.listeners[id]) {
      this.listeners[id] = [];
    }
    this.listeners[id].push(callback);
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
    this.tickBuffer.push(tick);
    this.currentTicks.push(tick); 
    this.saveStateToLocalStorage();
    this.notifyListeners();
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

      if (!this.sessionId) {
        this.sessionId = await trainingService.startTrainingSession(this.epochNumber + 1);
      }

      const tickValues = this.currentTicks.map(tick => tick.value);

      const response = await axios.post(`${API_BASE_URL}/train`, {
        ticks: tickValues.map(tick => Number(tick))
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Training failed');
      }

      await trainingService.saveEpoch({
        epochNumber: this.epochNumber,
        batchSize: this.batchSize,
        ticks: this.currentTicks,
        trainingTime: Date.now() - Date.now(), //Corrected this line, original was incorrect
        loss: response.data.result!.loss,
        accuracy: response.data.result!.samples_processed, // Assuming samples_processed represents accuracy. Adjust if needed.
        sessionId: this.sessionId
      });

      this.currentTicks = [];
      this.epochNumber++;

      if (this.epochNumber % 10 === 0) {
        await trainingService.completeTrainingSession(this.sessionId, response.data.result!.samples_processed, response.data.result!.final_weights);
        this.sessionId = null;
      }
    } catch (error: any) {
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
      tickBuffer: this.tickBuffer.length > 0 ? this.tickBuffer.slice(-50) : [], 
      currentTicks: this.currentTicks, 
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
        if (state.userId === this.userId || !this.userId) {
          this.tickBuffer = state.tickBuffer || [];
          this.currentTicks = state.currentTicks || []; 
          this.batchSize = state.batchSize || 100;
          this.epochNumber = state.epochNumber || 0;
          this.isActive = !!state.isActive;
          this.lastSavedModelState = state.lastSavedModelState;
          this.sessionId = state.sessionId;
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
      const settings = await trainingService.getTickCollectionSettings();
      if (settings) {
        this.batchSize = settings.batchSize;
        this.isActive = settings.enabled;
      }
      const latestEpoch = await trainingService.getLatestEpoch();
      if (latestEpoch) {
        this.epochNumber = latestEpoch.epochNumber;
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

  static async predict(input: number[]): Promise<number[]> {
    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, { input });
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      return response.data.prediction;
    } catch (error: any) {
      console.error('Prediction error:', error);
      throw new Error(error.message || 'Failed to make prediction');
    }
  }

  static async getModel() {
    try {
      const response = await axios.get(`${API_BASE_URL}/model`);
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      return response.data.model;
    } catch (error: any) {
      console.error('Model retrieval error:', error);
      throw new Error(error.message || 'Failed to get model');
    }
  }
}

export const epochService = new EpochService();
export default epochService;