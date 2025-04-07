
export interface TickData {
  timestamp: string | number;
  value: number;
  market: string;
  symbol?: string;
}

export interface TickCollectionSettings {
  enabled: boolean;
  batchSize: number;
  lastUpdated?: string;
}

export interface TickServiceState {
  isConnected: boolean;
  latestTick: TickData | null;
  ticks: TickData[];
  tickCount: number;
}
