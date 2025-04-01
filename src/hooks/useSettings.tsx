
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Define settings interface
export interface UserSettings {
  theme: string;
  accent: 'green' | 'blue' | 'purple' | 'red';
  font: 'JetBrains Mono' | 'Fira Code';
  chartStyle: 'line' | 'candlestick' | 'bar';
  terminalHeight: number;
  sidebarWidth: number;
  wsUrl: string;
  apiKey: string;
  subscription: string;
}

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  accent: 'green',
  font: 'JetBrains Mono',
  chartStyle: 'line',
  terminalHeight: 200,
  sidebarWidth: 150,
  wsUrl: 'wss://ws.binaryws.com/websockets/v3?app_id=1089',
  apiKey: '',
  subscription: '{"ticks":"R_10"}'
};

export const useSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Load settings from Supabase
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        // For non-authenticated users, try to load from localStorage
        const storedSettings = localStorage.getItem('nnticks_settings');
        if (storedSettings) {
          try {
            setSettings(JSON.parse(storedSettings));
          } catch (e) {
            setSettings(DEFAULT_SETTINGS);
          }
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading settings:', error);
          throw error;
        }

        if (data) {
          setSettings({
            theme: data.theme,
            accent: data.accent as UserSettings['accent'],
            font: data.font as UserSettings['font'],
            chartStyle: data.chart_style as UserSettings['chartStyle'],
            terminalHeight: data.terminal_height,
            sidebarWidth: data.sidebar_width,
            wsUrl: data.ws_url || DEFAULT_SETTINGS.wsUrl,
            apiKey: data.api_key || '',
            subscription: data.subscription || DEFAULT_SETTINGS.subscription
          });
        } else {
          // Create default settings if none exist
          await supabase.from('user_settings').insert({
            user_id: user.id,
            theme: DEFAULT_SETTINGS.theme,
            accent: DEFAULT_SETTINGS.accent,
            font: DEFAULT_SETTINGS.font,
            chart_style: DEFAULT_SETTINGS.chartStyle,
            terminal_height: DEFAULT_SETTINGS.terminalHeight,
            sidebar_width: DEFAULT_SETTINGS.sidebarWidth,
            ws_url: DEFAULT_SETTINGS.wsUrl,
            api_key: DEFAULT_SETTINGS.apiKey,
            subscription: DEFAULT_SETTINGS.subscription
          });
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Update settings
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    if (!user) {
      // For non-authenticated users, save to localStorage
      localStorage.setItem('nnticks_settings', JSON.stringify(updatedSettings));
      return;
    }

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
          subscription: updatedSettings.subscription
        });

      if (error) throw error;
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to save settings');
    }
  };

  return {
    settings,
    loading,
    updateSettings
  };
};
