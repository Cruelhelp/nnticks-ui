
import { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import SideBar from '@/components/SideBar';
import Terminal from '@/components/Terminal';
import Home from '@/components/Home';
import Charts from '@/components/Charts';
import Predictions from '@/components/Predictions';
import Training from '@/components/Training';
import History from '@/components/History';
import Leaderboard from '@/components/Leaderboard';
import Splash from './Splash';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const { settings } = useSettings();
  const { user, userDetails } = useAuth();
  
  // Show splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Track user session on component mount
  useEffect(() => {
    if (user) {
      // Update last login time
      updateUserLoginTime();
    }
  }, [user]);
  
  const updateUserLoginTime = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('users_extra')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Failed to update login time:', error);
    }
  };
  
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };
  
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };
  
  const toggleTerminal = () => {
    setShowTerminal(prev => !prev);
  };
  
  const resetLayout = () => {
    setShowSidebar(true);
    setShowTerminal(true);
  };
  
  // Apply accent color class based on settings
  useEffect(() => {
    const body = document.body;
    body.classList.remove('theme-blue', 'theme-purple', 'theme-red');
    
    if (settings.accent !== 'green') {
      body.classList.add(`theme-${settings.accent}`);
    }
    
    // Apply font
    document.documentElement.style.fontFamily = settings.font;
  }, [settings.accent, settings.font]);
  
  if (showSplash) {
    return <Splash />;
  }
  
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'home':
        return <Home onSectionChange={handleSectionChange} />;
      case 'charts':
        return <Charts />;
      case 'predictions':
        return <Predictions />;
      case 'training':
        return <Training />;
      case 'history':
        return <History />;
      case 'leaderboard':
        return <Leaderboard />;
      default:
        return <Home onSectionChange={handleSectionChange} />;
    }
  };
  
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar 
        toggleSidebar={toggleSidebar} 
        toggleTerminal={toggleTerminal}
        onReset={resetLayout}
        username={userDetails?.username || 'Guest'}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <SideBar 
            activeSection={activeSection} 
            onSectionChange={handleSectionChange} 
          />
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 p-4 overflow-auto">
            {renderActiveSection()}
          </main>
          
          {showTerminal && (
            <Terminal 
              onClose={() => setShowTerminal(false)}
              onMinimize={() => setShowTerminal(false)}
              onMaximize={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
