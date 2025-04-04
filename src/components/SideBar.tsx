
import { useEffect, useState } from 'react';
import { Bell, Brain, ChartBar, Clock, CreditCard, Home, Users, Settings, BarChart, Gauge, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SideBarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const SideBar = ({ activeSection, onSectionChange }: SideBarProps) => {
  const { user, userDetails } = useAuth();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  useEffect(() => {
    // Check if user is admin - fix the property access
    if (userDetails?.isAdmin) {
      setShowAdminPanel(true);
    }
  }, [userDetails]);
  
  const handleClick = (section: string) => {
    onSectionChange(section);
    
    const event = new CustomEvent('navigate-section', { detail: section });
    document.dispatchEvent(event);
  };
  
  const isActive = (section: string) => activeSection === section;
  
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'charts', label: 'Charts', icon: ChartBar },
    { id: 'predictions', label: 'Predictions', icon: Gauge },
    { id: 'training', label: 'Training', icon: Brain },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'leaderboard', label: 'Leaderboard', icon: Users },
    { id: 'neuralnet', label: 'Neural Net', icon: BarChart },
  ];
  
  return (
    <div className="min-h-full border-r bg-card w-64 overflow-hidden flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-1.5">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="font-semibold leading-none">NNticks</div>
            <div className="text-xs text-muted-foreground mt-0.5">Neural Network Trading</div>
          </div>
        </div>
      </div>
      
      <div className="py-2 flex-1 overflow-y-auto">
        <div className="p-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors ${
                isActive(item.id)
                  ? 'bg-primary/10 text-primary hover:bg-primary/15'
                  : 'hover:bg-muted'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        
        <div className="p-2 pt-4">
          <div className="text-xs font-medium text-muted-foreground ml-2 mb-2">Preferences</div>
          <button
            onClick={() => handleClick('settings')}
            className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors ${
              isActive('settings')
                ? 'bg-primary/10 text-primary hover:bg-primary/15'
                : 'hover:bg-muted'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
          
          {showAdminPanel && (
            <button
              onClick={() => handleClick('admin')}
              className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors ${
                isActive('admin')
                  ? 'bg-primary/10 text-primary hover:bg-primary/15'
                  : 'hover:bg-muted'
              }`}
            >
              <CreditCard className="h-5 w-5" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t bg-muted/50">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-full bg-background p-1">
              <User className="h-6 w-6" />
            </div>
            <div className="truncate">
              <div className="font-medium truncate">{userDetails?.username || user.email}</div>
              <div className="text-xs text-muted-foreground">
                {userDetails?.proStatus ? 'Pro Account' : 'Standard Account'}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Guest Mode</div>
        )}
      </div>
    </div>
  );
};

export default SideBar;
