
export type PredictionType = "rise" | "fall" | "even" | "odd";
export type PredictionPhase = "warning" | "counting" | "completed";
export type PredictionMode = "conservative" | "balanced" | "aggressive";

export interface PredictionModeConfig {
  mode: string;
  timeframe: number;
  window: number;
  threshold: number;
  minConfidence: number;
  predictionRate: number; // Added this property to fix the errors
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
