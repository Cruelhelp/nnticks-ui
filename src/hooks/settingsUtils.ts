import type { UserSettings } from './settingsTypes';

export const DEFAULT_SETTINGS: UserSettings = {
  accent: 'green',
  font: 'VT323',
  chartStyle: 'line',
  terminalHeight: 200,
  sidebarWidth: 250,
  wsUrl: '',
  apiKey: '',
  subscription: '',
  notifications: {
    email: false,
    predictions: true,
    training: true,
    market: true,
  },
};
