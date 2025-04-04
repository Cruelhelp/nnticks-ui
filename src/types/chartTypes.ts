
export interface TickData {
  timestamp: string | number;
  value: number;
  market: string;
  symbol?: string;  // Optional symbol property for compatibility
}

export interface ProcessedTickData {
  timestamp: number;
  price: number;
  volume?: number;
  symbol: string;
  epoch?: number;
  quote?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

export interface BrokerConfig {
  broker: string;
  wsUrl: string;
  apiKey: string;
  subscription: object;
}

// Define valid prediction phases
export type PredictionPhase = 'warning' | 'counting' | 'completed';

// Define valid prediction types
export type PredictionType = 'rise' | 'fall' | 'even' | 'odd';

// Define prediction modes
export type PredictionMode = 'fast' | 'balanced' | 'strict';

export interface PredictionModeConfig {
  mode: PredictionMode;
  minConfidence: number;
  description: string;
}

export const PREDICTION_MODES: Record<PredictionMode, PredictionModeConfig> = {
  fast: {
    mode: 'fast',
    minConfidence: 0.51, // 51% minimum confidence
    description: 'More frequent predictions with lower confidence threshold'
  },
  balanced: {
    mode: 'balanced',
    minConfidence: 0.65, // 65% minimum confidence
    description: 'Balanced approach between frequency and accuracy'
  },
  strict: {
    mode: 'strict',
    minConfidence: 0.80, // 80% minimum confidence
    description: 'Fewer but higher confidence predictions'
  }
};

export const brokerWebSockets: { [key: string]: string } = {
  deriv: 'wss://frontend.binaryws.com/websockets/v3',
  iqOption: 'wss://iqoption.com/api/ws',
  binance: 'wss://stream.binance.com:9443/ws',
  metatrader: 'wss://mt4.websocket.api', // Placeholder
  binary: 'wss://ws.binaryws.com/websockets/v3?app_id=1089'
};
