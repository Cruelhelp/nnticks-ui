
export type PredictionType = "rise" | "fall" | "even" | "odd";
export type PredictionPhase = "warning" | "counting" | "completed";
export type PredictionMode = "conservative" | "balanced" | "aggressive";

export interface PredictionModeConfig {
  mode: string;
  timeframe: number;
  window: number;
  threshold: number;
  minConfidence: number;
  predictionRate: number;
}

export const PREDICTION_MODES: Record<PredictionMode, PredictionModeConfig> = {
  conservative: {
    mode: "Conservative",
    timeframe: 5,
    window: 20,
    threshold: 0.7,
    minConfidence: 0.8,
    predictionRate: 30000
  },
  balanced: {
    mode: "Balanced",
    timeframe: 3,
    window: 15,
    threshold: 0.6,
    minConfidence: 0.65,
    predictionRate: 15000
  },
  aggressive: {
    mode: "Aggressive",
    timeframe: 1,
    window: 10,
    threshold: 0.5,
    minConfidence: 0.55,
    predictionRate: 7000
  }
};

export interface TickData {
  timestamp: string | number;
  value: number;
  market: string;
  symbol: string;  // Make sure this is defined and not optional
}

export interface TrainingResult {
  loss: number;
  accuracy: number;
  time?: number;
}

export interface SimulationState {
  isActive: boolean;
  speed: 'slow' | 'normal' | 'fast';
  tickCount: number;
  epochCount: number;
  lastUpdated: number;
}

export interface PredictionResult {
  prediction: number;
  confidence: number;
  direction?: 'up' | 'down' | 'neutral';
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
