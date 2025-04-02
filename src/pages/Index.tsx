
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
import Splash from './Splash';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, User } from 'lucide-react';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const { settings } = useSettings();
  const { user, userDetails, session, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Show splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Check authentication
  useEffect(() => {
    // If not logged in and not in guest mode, redirect to login
    const isGuest = localStorage.getItem('guestMode') === 'true';
    if (!user && !userDetails && !session && !isGuest) {
      navigate('/login');
    }
  }, [user, userDetails, session, navigate]);
  
  // Track user session on component mount
  useEffect(() => {
    if (user) {
      // Update last login time
      updateUserLoginTime();
    }
  }, [user]);
  
  // Adjust sidebar and terminal visibility on mobile
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
  
  // Apply accent color class based on settings
  useEffect(() => {
    const body = document.body;
    body.classList.remove('theme-blue', 'theme-purple', 'theme-red');
    
    if (settings?.accent !== 'green') {
      body.classList.add(`theme-${settings?.accent}`);
    }
    
    // Apply font
    if (settings?.font) {
      document.documentElement.style.fontFamily = settings.font;
    }
    
    // Set the background to black
    document.body.style.backgroundColor = '#000000';
    document.documentElement.style.backgroundColor = '#000000';
    
    // Update card and component colors
    document.documentElement.style.setProperty('--background', '0 0% 0%');
    document.documentElement.style.setProperty('--card', '0 0% 3%');
    document.documentElement.style.setProperty('--muted', '0 0% 9%');
  }, [settings?.accent, settings?.font]);
  
  // Handle resize observation
  useEffect(() => {
    const handleResize = () => {
      // Update layout based on window size if needed
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
      default:
        return <Home onSectionChange={handleSectionChange} />;
    }
  };
  
  // Get username from user details or localStorage (for guest mode)
  const username = userDetails?.username || localStorage.getItem('guestUsername') || 'Guest';
  
  // User dropdown component
  const UserDropdown = () => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={userDetails?.avatar || undefined} alt={username} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{username}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userDetails?.email || 'Guest User'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setActiveSection('account')}>
            <User className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.open("https://docs.nnticks.com", "_blank")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Preferences</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar 
        toggleSidebar={toggleSidebar} 
        toggleTerminal={toggleTerminal}
        onReset={resetLayout}
        username={username}
        userDropdown={<UserDropdown />}
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
  );
};

export default Index;
