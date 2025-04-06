
import { TickData } from "./tickTypes";

export interface TrainingResult {
  loss: number;
  accuracy: number;
  time?: number;
}

export interface EpochData {
  epochNumber: number;
  startTime: number;
  endTime?: number;
  ticks: TickData[];
  results?: TrainingResult;
}

export interface EpochCollectionStatus {
  isActive: boolean;
  isProcessing: boolean;
  currentCount: number;
  targetCount: number;
  progress: number;
}

export interface EpochServiceState {
  status: EpochCollectionStatus;
  batchSize: number;
  isInitialized: boolean;
  isActive: boolean;
  progress: number;
  epochsCompleted: number;
  epochs: EpochData[];
  isConnected: boolean;
}
