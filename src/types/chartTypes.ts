
export interface TickData {
  timestamp: string;
  value: number;
  market: string;
  symbol?: string;  // Add optional symbol property for compatibility
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

export const brokerWebSockets: { [key: string]: string } = {
  deriv: 'wss://frontend.binaryws.com/websockets/v3',
  iqOption: 'wss://iqoption.com/api/ws',
  binance: 'wss://stream.binance.com:9443/ws',
  metatrader: 'wss://mt4.websocket.api', // Placeholder
  binary: 'wss://ws.binaryws.com/websockets/v3?app_id=1089'
};
