import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/TopBar';
import SideBar from '@/components/SideBar';
import Terminal from '@/components/Terminal';
import Home from '@/components/Home';
import Charts from '@/components/Charts';
import Predictions from '@/components/Predictions';
import Training from '@/components/Training';
import History from '@/components/History';
import Leaderboard from '@/components/Leaderboard';
import NeuralNet from '@/components/NeuralNet';
import DebugTools from '@/components/DebugTools';
import Account from '@/components/Account';
import AdminPanel from '@/components/AdminPanel';
import Splash from './Splash';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Toaster } from '@/components/ui/sonner';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const { settings } = useSettings();
  const { user, userDetails, session } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    const isGuest = localStorage.getItem('guestMode') === 'true';
    if (!user && !userDetails && !session && !isGuest) {
      navigate('/login');
    }
  }, [user, userDetails, session, navigate]);
  
  useEffect(() => {
    if (user) {
      updateUserLoginTime();
    }
  }, [user]);
  
  useEffect(() => {
    const handleNavigateEvent = (event: CustomEvent) => {
      setActiveSection(event.detail);
    };
    
    document.addEventListener('navigate-section', handleNavigateEvent as EventListener);
    
    return () => {
      document.removeEventListener('navigate-section', handleNavigateEvent as EventListener);
    };
  }, []);
  
  useEffect(() => {
    if (isMobile) {
      setShowSidebar(false);
    } else {
      setShowSidebar(true);
    }
  }, [isMobile]);
  
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
    if (isMobile) {
      setShowSidebar(false);
    }
  };
  
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };
  
  const toggleTerminal = () => {
    setShowTerminal(prev => !prev);
  };
  
  const resetLayout = () => {
    setShowSidebar(true);
    setShowTerminal(false);
  };
  
  useEffect(() => {
    const body = document.body;
    body.classList.remove('theme-blue', 'theme-purple', 'theme-red');
    
    if (settings?.accent !== 'green') {
      body.classList.add(`theme-${settings?.accent}`);
    }
    
    if (settings?.font) {
      document.documentElement.style.fontFamily = settings.font;
    }
    
    document.body.style.backgroundColor = '#000000';
    document.documentElement.style.backgroundColor = '#000000';
    
    document.documentElement.style.setProperty('--background', '0 0% 0%');
    document.documentElement.style.setProperty('--card', '0 0% 3%');
    document.documentElement.style.setProperty('--muted', '0 0% 9%');
  }, [settings?.accent, settings?.font]);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && showSidebar) {
        setShowSidebar(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [showSidebar]);
  
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
      case 'neuralnet':
        return <NeuralNet />;
      case 'debug':
        return <DebugTools />;
      case 'account':
        return <Account />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Home onSectionChange={handleSectionChange} />;
    }
  };
  
  const username = userDetails?.username || localStorage.getItem('guestUsername') || 'Guest';
  
  return (
    <>
      <div className="h-screen flex flex-col overflow-hidden">
        <TopBar 
          toggleSidebar={toggleSidebar} 
          toggleTerminal={toggleTerminal}
          onReset={resetLayout}
          username={username}
        />
        
        <div className="flex-1 flex overflow-hidden">
          {showSidebar && (
            <div className={`${isMobile ? 'absolute z-20 h-full' : ''}`}>
              <SideBar 
                activeSection={activeSection} 
                onSectionChange={handleSectionChange} 
              />
            </div>
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
      <Toaster />
    </>
  );
};

export default Index;
