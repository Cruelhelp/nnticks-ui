
export type PredictionType = "rise" | "fall" | "even" | "odd";
export type PredictionOutcome = "win" | "loss" | "pending";
export type PredictionMode = "conservative" | "balanced" | "aggressive";

export interface PredictionModeConfig {
  mode: string;
  timeframe: number;
  window: number;
  threshold: number;
  minConfidence: number;
  predictionRate: number;
}

export interface PredictionData {
  id?: string;
  userId?: string;
  type: PredictionType;
  confidence: number;
  timePeriod: number;
  market: string;
  startPrice?: number;
  endPrice?: number;
  outcome?: PredictionOutcome;
  createdAt?: string;
  completedAt?: string;
  indicators?: any;
}

export interface PredictionResult {
  prediction: number;
  confidence: number;
  direction?: 'up' | 'down' | 'neutral';
  type?: PredictionType;
}

export interface PredictionServiceState {
  isRunning: boolean;
  predictionMode: string;
  pendingPrediction: PredictionData | null;
  completedPredictions: PredictionData[];
  countdown: number | null;
  tickCountdown: number | null;
  pendingTicks: any[];
  stats: {
    wins: number;
    losses: number;
    winRate: number;
  };
}
