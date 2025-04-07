
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { Menu, Bell, Terminal as TerminalIcon } from 'lucide-react';
import WebSocketStatus from './WebSocketStatus';

interface TopBarProps {
  toggleSidebar: () => void;
  toggleTerminal: () => void;
  showTerminal?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ 
  toggleSidebar, 
  toggleTerminal,
  showTerminal = false
}) => {
  const { user, userDetails } = useAuth();
  const { settings } = useSettings();
  
  return (
    <header className="bg-background border-b flex items-center justify-between h-14 px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="font-semibold">NNticks</div>
      </div>
      
      <div className="flex items-center gap-2">
        <WebSocketStatus compact />
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </Button>
        
        <Button 
          variant={showTerminal ? "default" : "ghost"} 
          size="icon" 
          onClick={toggleTerminal}
        >
          <TerminalIcon className="h-5 w-5" />
        </Button>
        
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
          {userDetails?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'G'}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
