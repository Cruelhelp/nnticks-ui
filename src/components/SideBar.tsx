
import React from 'react';
import { Brain, ChartLine, BarChart, Trophy, Clock, Gavel, Settings, User, LineChart, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface SideBarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const SideBar: React.FC<SideBarProps> = ({ activeSection, onSectionChange }) => {
  const { userDetails } = useAuth();
  const isAdmin = userDetails?.isAdmin || false;
  
  const sidebarLinks = [
    { id: 'home', label: 'Home', icon: <User className="h-5 w-5" /> },
    { id: 'charts', label: 'Charts', icon: <ChartLine className="h-5 w-5" /> },
    { id: 'predictions', label: 'Predictions', icon: <BarChart className="h-5 w-5" /> },
    { id: 'training', label: 'Training', icon: <Brain className="h-5 w-5" /> },
    { id: 'epochs', label: 'Epochs', icon: <Database className="h-5 w-5" /> },
    { id: 'history', label: 'History', icon: <Clock className="h-5 w-5" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="h-5 w-5" /> },
    { id: 'neuralnet', label: 'Neural Net', icon: <LineChart className="h-5 w-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> }
  ];
  
  if (isAdmin) {
    sidebarLinks.push({ id: 'admin', label: 'Admin', icon: <Gavel className="h-5 w-5" /> });
  }
  
  return (
    <div className="h-full w-60 bg-background border-r p-4">
      <div className="flex flex-col space-y-1">
        {sidebarLinks.map((link) => (
          <Button
            key={link.id}
            variant={activeSection === link.id ? 'default' : 'ghost'}
            className={`justify-start ${activeSection === link.id ? '' : 'text-muted-foreground'}`}
            onClick={() => onSectionChange(link.id)}
          >
            {link.icon}
            <span className="ml-2">{link.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SideBar;
