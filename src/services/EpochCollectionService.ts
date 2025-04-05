
import { BrowserEventEmitter } from '@/lib/utils';

// Add type definition for ModelTrainingResults
export interface ModelTrainingResults {
  loss: number;
  accuracy: number;
  time: number;
}

export interface EpochData {
  epochNumber: number;
  startTime: number;
  endTime?: number;
  results?: ModelTrainingResults;
}

class EpochCollectionService extends BrowserEventEmitter {
  private epochs: EpochData[] = [];
  private currentEpoch: number = 0;
  private isCollectingData: boolean = false;
  private batchSize: number = 100;
  private localStorageKey: string = 'epochCollection';
  private progress: number = 0;

  constructor() {
    super();
    this.loadEpochs();
  }

  public startNewEpoch(): void {
    if (this.isCollectingData) {
      console.warn('Already collecting data for an epoch.');
      return;
    }

    this.isCollectingData = true;
    this.currentEpoch++;

    const newEpoch: EpochData = {
      epochNumber: this.currentEpoch,
      startTime: Date.now(),
    };

    this.epochs.push(newEpoch);
    this.saveEpochs();
    this.emit('statusChange', this.isCollectingData);
  }

  public async completeEpoch(epochNumber: number, results: ModelTrainingResults): Promise<boolean> {
    if (!this.isCollectingData) {
      console.warn('Not collecting data for an epoch.');
      return false;
    }

    const epochIndex = this.epochs.findIndex(epoch => epoch.epochNumber === epochNumber);
    if (epochIndex === -1) {
      console.warn(`Epoch ${epochNumber} not found.`);
      return false;
    }

    this.epochs[epochIndex] = {
      ...this.epochs[epochIndex],
      endTime: Date.now(),
      results: {
        loss: results.loss,
        accuracy: results.accuracy,
        time: results.time
      },
    };

    this.isCollectingData = false;
    this.saveEpochs();
    this.emit('epochCompleted', this.epochs[epochIndex]);
    this.emit('statusChange', this.isCollectingData);
    return true;
  }

  public getEpochs(): EpochData[] {
    return [...this.epochs];
  }

  public getCurrentEpoch(): number {
    return this.currentEpoch;
  }

  public isCollecting(): boolean {
    return this.isCollectingData;
  }

  public setBatchSize(size: number): void {
    this.batchSize = size;
  }

  public getBatchSize(): number {
    return this.batchSize;
  }

  public updateProgress(progress: number): void {
    this.progress = progress;
    this.emit('progress', progress);
  }

  public getProgress(): number {
    return this.progress;
  }

  public clearEpochs(): void {
    this.epochs = [];
    this.currentEpoch = 0;
    localStorage.removeItem(this.localStorageKey);
    this.emit('epochsCleared');
  }

  private saveEpochs(): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.epochs));
  }

  private loadEpochs(): void {
    const storedEpochs = localStorage.getItem(this.localStorageKey);
    if (storedEpochs) {
      try {
        this.epochs = JSON.parse(storedEpochs);
        this.currentEpoch = this.epochs.length > 0 ? this.epochs[this.epochs.length - 1].epochNumber : 0;
      } catch (error) {
        console.error('Failed to load epochs from local storage:', error);
        this.epochs = [];
        this.currentEpoch = 0;
      }
    }
  }
}

export const epochCollectionService = new EpochCollectionService();
