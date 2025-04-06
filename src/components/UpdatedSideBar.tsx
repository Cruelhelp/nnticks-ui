
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Home,
  LineChart,
  Brain,
  History,
  Trophy,
  Settings,
  Terminal,
  Clock,
  Info,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SideBarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const UpdatedSideBar: React.FC<SideBarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { user, userDetails } = useAuth();
  const isAdmin = userDetails?.isAdmin || false; // Get isAdmin from userDetails

  const menuItems = [
    { id: 'home', name: 'Home', icon: Home, requiresAuth: false },
    { id: 'charts', name: 'Charts', icon: LineChart, requiresAuth: false },
    { id: 'predictions', name: 'Predictions', icon: Brain, requiresAuth: false },
    { id: 'training', name: 'Training', icon: Clock, requiresAuth: false },
    { id: 'epochs', name: 'Epochs', icon: Brain, requiresAuth: true },
    { id: 'history', name: 'History', icon: History, requiresAuth: true },
    { id: 'leaderboard', name: 'Leaderboard', icon: Trophy, requiresAuth: false },
    { id: 'neuralnet', name: 'Neural Net', icon: Brain, requiresAuth: false },
    { id: 'legal', name: 'Legal', icon: Shield, requiresAuth: false },
    { id: 'settings', name: 'Settings', icon: Settings, requiresAuth: false },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'admin', name: 'Admin', icon: Terminal, requiresAuth: true });
  }

  return (
    <div className="h-full flex flex-col w-56 bg-background border-r border-border px-2 py-3">
      <div className="text-center mb-6 px-2">
        <h3 className="font-bold text-lg text-primary">NN Ticks</h3>
        <p className="text-xs text-muted-foreground">Neural Network Trading</p>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          // Skip items that require auth when user is not logged in
          (!item.requiresAuth || user) && (
            <Button
              key={item.id}
              variant={activeSection === item.id ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start mb-1 pl-3',
                activeSection === item.id && 'bg-muted'
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 mr-3',
                  activeSection === item.id
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              />
              {item.name}
            </Button>
          )
        ))}
      </nav>

      <div className="pt-4 mt-4 border-t text-center px-2">
        <div className="text-xs text-muted-foreground">
          <p>Version 2.0.0</p>
          <p className="mt-1">© 2025 NN Ticks</p>
        </div>
      </div>
    </div>
  );
};

export default UpdatedSideBar;
