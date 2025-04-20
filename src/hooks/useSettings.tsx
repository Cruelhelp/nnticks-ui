import { useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/useAuth';
import { DEFAULT_SETTINGS } from './settingsUtils';
import { UserSettings } from './settingsTypes';
import { SettingsContext } from './SettingsContextObject';

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
              terminalHeight: data.terminal_height,
              sidebarWidth: data.sidebar_width,
              wsUrl: data.ws_url,
              apiKey: data.api_key,
              subscription: data.subscription,
              notifications: data.notifications
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
