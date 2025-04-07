import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type UserSettings = {
  theme: string;
  accent: 'green' | 'blue' | 'purple' | 'red';
  font: 'JetBrains Mono' | 'Fira Code' | 'Courier New' | 'Consolas' | 'Menlo' | 'Monaco' | 'Roboto Mono' | 'Source Code Pro' | 'VT323' | 'default' | 'sans-serif';
  chartType: 'line' | 'candlestick' | 'bar'; // Added chartType
  chartStyle: 'line' | 'candlestick' | 'bar';
  terminalHeight: number;
  sidebarWidth: number;
  sidebarCollapsed: boolean; // Added sidebarCollapsed
  wsUrl: string;
  apiKey: string;
  subscription: string;
  notifications: {
    enabled: boolean; // Changed notifications structure
    sound: boolean;
    predictions: boolean;
    training: boolean;
    system: boolean;
  };
  performance: {
    animationsEnabled: boolean;
    reducedMotion: boolean;
    dataRetentionDays: number;
  };
  neuralNetwork: {
    autosave: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    showDebugInfo: boolean;
  };
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  accent: 'blue',
  font: 'JetBrains Mono',
  chartType: 'line',
  chartStyle: 'line',
  sidebarCollapsed: false,
  terminalHeight: 200,
  sidebarWidth: 200,
  wsUrl: 'wss://ws.binaryws.com/websockets/v3?app_id=1089',
  apiKey: '',
  subscription: '{"ticks":"R_10"}',
  notifications: {
    enabled: true,
    sound: true,
    predictions: true,
    training: true,
    system: true
  },
  performance: {
    animationsEnabled: true,
    reducedMotion: false,
    dataRetentionDays: 30
  },
  neuralNetwork: {
    autosave: true,
    backupFrequency: 'daily',
    showDebugInfo: false
  }
};

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const auth = useAuth();
  const user = auth?.user;

  useEffect(() => {
    const loadSettings = async () => {
      const storedSettings = localStorage.getItem('userSettings');

      if (storedSettings) {
        try {
          const parsedSettings = JSON.parse(storedSettings);
          setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
        } catch (error) {
          console.error('Error parsing settings from localStorage:', error);
        }
      }

      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error('Error loading settings:', error);
            return;
          }

          if (data) {
            const userSettings: Partial<UserSettings> = {
              theme: data.theme,
              accent: data.accent as UserSettings['accent'],
              font: data.font as UserSettings['font'],
              chartStyle: data.chart_style as UserSettings['chartStyle'],
              chartType: data.chart_type as UserSettings['chartType'], // Added chartType
              terminalHeight: data.terminal_height,
              sidebarWidth: data.sidebar_width,
              sidebarCollapsed: data.sidebar_collapsed, // Added sidebarCollapsed
              wsUrl: data.ws_url,
              apiKey: data.api_key,
              subscription: data.subscription,
              notifications: data.notifications,
              performance: data.performance,
              neuralNetwork: data.neural_network
            };

            setSettings({ ...DEFAULT_SETTINGS, ...userSettings });

            localStorage.setItem('userSettings', JSON.stringify(userSettings));
          }
        } catch (error) {
          console.error('Error loading settings:', error);
        }
      }
    };

    loadSettings();
  }, [user]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };

    setSettings(updatedSettings);

    localStorage.setItem('userSettings', JSON.stringify(updatedSettings));

    if (user) {
      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            theme: updatedSettings.theme,
            accent: updatedSettings.accent,
            font: updatedSettings.font,
            chart_style: updatedSettings.chartStyle,
            chart_type: updatedSettings.chartType, // Added chartType
            terminal_height: updatedSettings.terminalHeight,
            sidebar_width: updatedSettings.sidebarWidth,
            sidebar_collapsed: updatedSettings.sidebarCollapsed, // Added sidebarCollapsed
            ws_url: updatedSettings.wsUrl,
            api_key: updatedSettings.apiKey,
            subscription: updatedSettings.subscription,
            notifications: updatedSettings.notifications,
            performance: updatedSettings.performance,
            neural_network: updatedSettings.neuralNetwork,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (error) {
          console.error('Error saving settings:', error);
          throw error;
        }
      } catch (error) {
        console.error('Error saving settings:', error);
        throw error;
      }
    }

    if (newSettings.theme) {
      document.documentElement.classList.toggle('dark', newSettings.theme === 'dark');
    }

    if (newSettings.font) {
      document.documentElement.style.fontFamily = newSettings.font;
    }

    return Promise.resolve();
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);

  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
};