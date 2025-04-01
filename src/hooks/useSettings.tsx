
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
}

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  accent: 'green',
  font: 'JetBrains Mono',
  chartStyle: 'line',
  terminalHeight: 200,
  sidebarWidth: 150
};

export const useSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Load settings from Supabase
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setSettings(DEFAULT_SETTINGS);
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
            sidebarWidth: data.sidebar_width
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
            sidebar_width: DEFAULT_SETTINGS.sidebarWidth
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Update settings
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) {
      // For non-authenticated users, just update local state
      setSettings({ ...settings, ...newSettings });
      return;
    }

    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          theme: updatedSettings.theme,
          accent: updatedSettings.accent,
          font: updatedSettings.font,
          chart_style: updatedSettings.chartStyle,
          terminal_height: updatedSettings.terminalHeight,
          sidebar_width: updatedSettings.sidebarWidth
        });

      if (error) throw error;
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
