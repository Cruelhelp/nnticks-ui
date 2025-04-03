
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Menu, Bell, TerminalSquare, Settings, LogOut, UserCircle, Shield } from 'lucide-react';
import SettingsDialog from '@/components/SettingsDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import ConnectionStatus from '@/components/ConnectionStatus';

interface TopBarProps {
  toggleSidebar: () => void;
  toggleTerminal: () => void;
  onReset: () => void;
  username: string;
}

const TopBar: React.FC<TopBarProps> = ({ toggleSidebar, toggleTerminal, onReset, username }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user, userDetails, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const saveToast = toast.loading('Signing out...');
      await signOut();
      localStorage.removeItem('userSettings');
      localStorage.removeItem('guestMode');
      localStorage.removeItem('guestUsername');
      
      toast.dismiss(saveToast);
      toast.success('Successfully logged out');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const notifications = [
    {
      title: 'Training complete',
      description: 'Model trained with 89% accuracy',
      timestamp: new Date().getTime() - 25 * 60 * 1000, // 25 minutes ago
      read: false
    },
    {
      title: 'Prediction successful',
      description: 'Last prediction was correct',
      timestamp: new Date().getTime() - 120 * 60 * 1000, // 2 hours ago
      read: true
    }
  ];
  
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
    let interval = Math.floor(seconds / 31536000);
    
    if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
    return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
  };

  const handleNavigateToAccount = () => {
    navigate('/');
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('navigate-section', { detail: 'account' }));
    }, 100);
  };

  const handleAvatarClick = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const saveToast = toast.loading('Uploading avatar...');
      
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        await supabase.from('users_extra').update({
          avatar_url: publicUrl
        }).eq('user_id', user?.id);
        
        toast.dismiss(saveToast);
        toast.success('Avatar updated successfully');
        
        window.location.reload();
      } catch (error) {
        console.error('Error uploading avatar:', error);
        toast.dismiss(saveToast);
        toast.error('Failed to upload avatar');
      }
    };
    input.click();
  };

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 bg-background">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:flex">
          <Menu className="h-5 w-5" />
        </Button>
        
        <Logo size={24} />
        
        {userDetails?.proStatus && (
          <Badge>PRO</Badge>
        )}
        
        <div className="ml-4 flex items-center">
          <ConnectionStatus />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="link"
          className="mr-4 flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          onClick={handleNavigateToAccount}
        >
          <UserCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{username}</span>
        </Button>

        {userDetails?.isAdmin && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mr-2"
            onClick={() => navigate('/admin')}
          >
            <Shield className="h-4 w-4 mr-2" /> Admin
          </Button>
        )}
        
        <Button variant="ghost" size="icon" onClick={toggleTerminal}>
          <TerminalSquare className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>Notifications</span>
              <Button variant="outline" size="sm">Mark all read</Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              <>
                {notifications.map((notification, index) => (
                  <DropdownMenuItem key={index} className={`p-0 ${!notification.read ? 'bg-secondary/50' : ''}`}>
                    <div className="w-full p-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">{notification.description}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center">
                  View all notifications
                </DropdownMenuItem>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No notifications
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full" onClick={handleAvatarClick}>
              <Avatar className="h-9 w-9">
                <AvatarImage src={userDetails?.avatar_url || undefined} alt={username} />
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
                  {user?.email || 'Guest User'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleNavigateToAccount}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSettingsOpen(true)}> 
              <Settings className="mr-2 h-4 w-4" />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleNavigateToAccount}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Upgrade to Pro</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
};

export default TopBar;
