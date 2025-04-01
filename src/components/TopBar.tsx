
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, User, Settings, LogOut, FileText, Edit, Eye, Maximize, Save } from "lucide-react";
import Logo from "./Logo";
import { useSettings } from "@/hooks/useSettings";
import { useState } from "react";
import SettingsDialog from "./SettingsDialog";

interface TopBarProps {
  toggleSidebar: () => void;
  toggleTerminal: () => void;
  onReset: () => void;
}

const TopBar = ({ toggleSidebar, toggleTerminal, onReset }: TopBarProps) => {
  const { user, userDetails, signOut } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings } = useSettings();

  // Menu handlers
  const handleSave = () => {
    // Save current app state to local storage
    localStorage.setItem('nnticks_state', JSON.stringify({
      timestamp: new Date().toISOString(),
      saved: true
    }));
    
    // Show feedback
    const message = user ? 'State saved and synced to cloud' : 'State saved locally';
    // toast.success(message);
  };
  
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-12 items-center px-2 justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-1">
            <Menu size={20} />
          </Button>
          <Logo />
          
          <div className="ml-4 flex">
            {/* File Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs">File</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={onReset} className="flex items-center gap-2">
                  <FileText size={16} /> New Session
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSave} className="flex items-center gap-2">
                  <Save size={16} /> Save Data
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2" disabled={!userDetails?.proStatus}>
                  <FileText size={16} /> Export PDF {!userDetails?.proStatus && "(Pro)"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="flex items-center gap-2">
                  <LogOut size={16} /> Exit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs">Edit</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Edit size={16} /> Undo
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Edit size={16} /> Redo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2">
                  Clear Terminal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs">View</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={toggleTerminal} className="flex items-center gap-2">
                  <Eye size={16} /> Toggle Terminal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleFullscreen} className="flex items-center gap-2">
                  <Maximize size={16} /> Fullscreen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onReset} className="flex items-center gap-2">
                  <Eye size={16} /> Reset Layout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Settings Menu */}
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSettingsOpen(true)}>Settings</Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2">
                  <User size={16} />
                  {userDetails?.username || user.email?.split('@')[0]}
                  {userDetails?.proStatus && <span className="text-primary text-xs">(Pro)</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="flex items-center gap-2">
                  <Settings size={16} /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="flex items-center gap-2">
                  <LogOut size={16} /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" className="h-8" onClick={() => window.location.href = '/login'}>
              Sign in
            </Button>
          )}
        </div>
      </div>
      
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
};

export default TopBar;
