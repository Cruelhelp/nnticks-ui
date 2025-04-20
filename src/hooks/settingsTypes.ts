export type UserSettings = {
  theme: string;
  accent: 'green' | 'blue' | 'purple' | 'red';
  font: 'JetBrains Mono' | 'Fira Code' | 'Courier New' | 'Consolas' | 'Menlo' | 'Monaco' | 'Roboto Mono' | 'Source Code Pro' | 'VT323' | 'default' | 'sans-serif';
  chartStyle: 'line' | 'candlestick' | 'bar';
  terminalHeight: number;
  sidebarWidth: number;
  wsUrl: string;
  apiKey: string;
  subscription: string;
  notifications: {
    email: boolean;
    predictions: boolean;
    training: boolean;
    market: boolean;
  };
};

export interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}
