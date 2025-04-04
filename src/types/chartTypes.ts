
export interface TickData {
  timestamp: string;
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

export const brokerWebSockets: { [key: string]: string } = {
  deriv: 'wss://frontend.binaryws.com/websockets/v3',
  iqOption: 'wss://iqoption.com/api/ws',
  binance: 'wss://stream.binance.com:9443/ws',
  metatrader: 'wss://mt4.websocket.api', // Placeholder
  binary: 'wss://ws.binaryws.com/websockets/v3?app_id=1089'
};
