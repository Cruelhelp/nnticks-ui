
import React from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Settings, TerminalSquare, Layout, UserCircle, Bell, LogOut, ChevronDown, Menu, Sidebar } from 'lucide-react';
import SettingsDialog from '@/components/SettingsDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  toggleSidebar: () => void;
  toggleTerminal: () => void;
  onReset: () => void;
  username: string;
}

const TopBar: React.FC<TopBarProps> = ({ toggleSidebar, toggleTerminal, onReset, username }) => {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const { user, userDetails, signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    try {
      // Update session status in Supabase
      if (user) {
        await supabase
          .from('user_sessions')
          .update({ 
            end_time: new Date().toISOString(),
            status: 'ended' 
          })
          .eq('user_id', user.id)
          .eq('status', 'active');
      }
      
      // Sign out
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <header className="h-14 border-b flex items-center justify-between px-4 bg-background">
      {/* Left side */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:flex">
          <Sidebar className="h-5 w-5" />
        </Button>
        
        <Logo size={24} />
        
        <span className="font-bold tracking-tight ml-2">NNticks</span>
        {userDetails?.proStatus && (
          <Badge className="font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600">
            PRO
          </Badge>
        )}
      </div>
      
      {/* Right side */}
      <div className="flex items-center gap-2">
        <div className="mr-4 flex items-center gap-1.5">
          <UserCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{username}</span>
          <span className="h-3 w-1.5 bg-primary cursor-blink"></span>
        </div>
        
        <Button variant="ghost" size="icon" onClick={toggleTerminal}>
          <TerminalSquare className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon" onClick={onReset}>
          <Layout className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex flex-col">
                <span className="font-medium">Market update</span>
                <span className="text-xs text-muted-foreground">New volatility data available</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col">
                <span className="font-medium">Prediction successful</span>
                <span className="text-xs text-muted-foreground">Your last prediction was correct</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <ChevronDown className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!userDetails?.proStatus && (
              <>
                <DropdownMenuLabel className="flex items-center">
                  <span className="text-purple-600 flex items-center gap-1 font-semibold">
                    Upgrade to Pro
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => window.location.href = `https://paypal.me/username?business=support@nnticks.com`}
                  className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-500/30 hover:from-purple-500/30 hover:to-indigo-500/30"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">Get PRO access</span>
                    <span className="text-xs">Advanced prediction models & features</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => navigate('/account')}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
};

export default TopBar;
