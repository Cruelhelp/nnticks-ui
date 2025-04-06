import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/TopBar';
import SideBar from '@/components/SideBar';
import Terminal from '@/components/Terminal';
import Dashboard from '@/components/Dashboard';
import Charts from '@/components/Charts';
import Predictions from '@/components/Predictions';
import Training from '@/components/Training';
import History from '@/components/History';
import NeuralNet from '@/components/NeuralNetwork';
import Account from '@/components/Account';
import Splash from './Splash';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Toaster } from '@/components/ui/sonner';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
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
  
  if (showSplash) {
    return <Splash />;
  }
  
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'charts':
        return <Charts />;
      case 'predictions':
        return <Predictions />;
      case 'training':
        return <Training />;
      case 'history':
        return <History />;
      case 'neuralnet':
        return <NeuralNet />;
      case 'account':
        return <Account />;
      default:
        return <Dashboard />;
    }
  };
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <TopBar 
        toggleSidebar={toggleSidebar} 
        toggleTerminal={toggleTerminal} 
        showTerminal={showTerminal}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <SideBar 
            activeSection={activeSection} 
            onSectionChange={handleSectionChange}
          />
        )}
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {renderSection()}
        </main>
      </div>
      
      {showTerminal && (
        <Terminal 
          onClose={toggleTerminal} 
          onMinimize={() => {}} 
          onMaximize={() => {}}
        />
      )}
      
      <Toaster />
    </div>
  );
};

export default Index;
