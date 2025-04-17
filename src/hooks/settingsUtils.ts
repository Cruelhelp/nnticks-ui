import { UserSettings } from './useSettings';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  accent: 'green',
  font: 'VT323',
  chartStyle: 'line',
  terminalHeight: 200,
  sidebarWidth: 200,
  wsUrl: 'wss://ws.binaryws.com/websockets/v3?app_id=1089',
  apiKey: '',
  subscription: '{"ticks":"R_10"}',
  notifications: {
    email: false,
    predictions: true,
    training: true,
    market: false
  }
};
