
import { useState, useEffect, createContext, useContext, PropsWithChildren } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type UserSettings = {
  wsUrl: string;
  apiKey: string;
  subscription: string;
  font: 'JetBrains Mono' | 'Fira Code' | 'Courier New' | 'Consolas' | 'Menlo' | 'Monaco' | 'Roboto Mono' | 'Source Code Pro';
  accent: 'green' | 'blue' | 'purple' | 'red';
  chartStyle: 'line' | 'candlestick' | 'bar';
  terminalHeight: number;
  sidebarWidth: number;
  theme?: string;
};

export const DEFAULT_SETTINGS: UserSettings = {
  wsUrl: 'wss://ws.binaryws.com/websockets/v3?app_id=1089',
  apiKey: '',
  subscription: '{"ticks":"R_10"}',
  font: 'JetBrains Mono',
  accent: 'green',
  chartStyle: 'line',
  terminalHeight: 200,
  sidebarWidth: 200,
};

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: async () => {},
});

export const SettingsProvider = ({ children }: PropsWithChildren) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const { user } = useAuth();

  // Load settings from localStorage or Supabase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // First try to get from local storage
        const savedSettings = localStorage.getItem('user_settings');
        
        if (savedSettings) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
        }
        
        // If logged in, get settings from Supabase
        if (user) {
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (error && error.code !== 'PGRST116') {
            // PGRST116 is "no rows returned" error, other errors are issues
            console.error('Error loading settings:', error);
          }
          
          if (data) {
            // Format the data to match our settings structure
            const dbSettings: UserSettings = {
              wsUrl: data.ws_url || DEFAULT_SETTINGS.wsUrl,
              apiKey: data.api_key || DEFAULT_SETTINGS.apiKey,
              subscription: data.subscription || DEFAULT_SETTINGS.subscription,
              font: data.font as any || DEFAULT_SETTINGS.font,
              accent: data.accent as any || DEFAULT_SETTINGS.accent,
              chartStyle: data.chart_style as any || DEFAULT_SETTINGS.chartStyle,
              terminalHeight: data.terminal_height || DEFAULT_SETTINGS.terminalHeight,
              sidebarWidth: data.sidebar_width || DEFAULT_SETTINGS.sidebarWidth,
              theme: data.theme || 'dark',
            };
            
            // Save to localStorage and state
            localStorage.setItem('user_settings', JSON.stringify(dbSettings));
            setSettings(dbSettings);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, [user]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      // Save to localStorage
      localStorage.setItem('user_settings', JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
      
      // If logged in, save to Supabase
      if (user) {
        // Convert to database structure
        const dbSettings = {
          user_id: user.id,
          ws_url: updatedSettings.wsUrl,
          api_key: updatedSettings.apiKey,
          subscription: updatedSettings.subscription,
          font: updatedSettings.font,
          accent: updatedSettings.accent,
          chart_style: updatedSettings.chartStyle,
          terminal_height: updatedSettings.terminalHeight,
          sidebar_width: updatedSettings.sidebarWidth,
          theme: updatedSettings.theme || 'dark',
          updated_at: new Date().toISOString(),
        };
        
        // Upsert settings
        const { error } = await supabase
          .from('user_settings')
          .upsert(dbSettings, { onConflict: 'user_id' });
          
        if (error) {
          console.error('Error saving settings to Supabase:', error);
        }
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
