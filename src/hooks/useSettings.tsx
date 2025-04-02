
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type UserSettings = {
  theme: string;
  accent: 'green' | 'blue' | 'purple' | 'red';
  font: 'JetBrains Mono' | 'Fira Code' | 'Courier New' | 'Consolas' | 'Menlo' | 'Monaco' | 'Roboto Mono' | 'Source Code Pro';
  chartStyle: 'line' | 'candlestick' | 'bar';
  terminalHeight: number;
  sidebarWidth: number;
  wsUrl: string;
  apiKey: string;
  subscription: string;
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  accent: 'green',
  font: 'JetBrains Mono',
  chartStyle: 'line',
  terminalHeight: 200,
  sidebarWidth: 200,
  wsUrl: 'wss://ws.binaryws.com/websockets/v3?app_id=1089',
  apiKey: '',
  subscription: '{"ticks":"R_10"}',
};

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const { user } = useAuth();

  useEffect(() => {
    const loadSettings = async () => {
      // First, try to load from local storage
      const storedSettings = localStorage.getItem('userSettings');
      
      if (storedSettings) {
        try {
          const parsedSettings = JSON.parse(storedSettings);
          setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
        } catch (error) {
          console.error('Error parsing settings from localStorage:', error);
        }
      }
      
      // If authenticated, try to load from Supabase
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
              terminalHeight: data.terminal_height,
              sidebarWidth: data.sidebar_width,
              wsUrl: data.ws_url,
              apiKey: data.api_key,
              subscription: data.subscription,
            };
            
            setSettings({ ...DEFAULT_SETTINGS, ...userSettings });
            
            // Save to localStorage for faster future loads
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
    
    // Update local state
    setSettings(updatedSettings);
    
    // Save to localStorage
    localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
    
    // If authenticated, save to Supabase
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
            terminal_height: updatedSettings.terminalHeight,
            sidebar_width: updatedSettings.sidebarWidth,
            ws_url: updatedSettings.wsUrl,
            api_key: updatedSettings.apiKey,
            subscription: updatedSettings.subscription,
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
    
    // Apply theme if it changed
    if (newSettings.theme) {
      document.documentElement.classList.toggle('dark', newSettings.theme === 'dark');
    }
    
    // Apply font if it changed
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
