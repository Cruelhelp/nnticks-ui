
export interface TickData {
  timestamp: string;
  value: number;
  market: string;
}

export interface ProcessedTickData extends TickData {
  time: string;
  formattedValue: number;
  rsi?: number;
  ma?: number;
  bollingerMiddle?: number;
  bollingerUpper?: number;
  bollingerLower?: number;
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
