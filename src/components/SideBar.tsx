
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Home, LineChart, FileText, Dumbbell, History, Trophy, Shield, BrainCircuit, Bug, UserCog } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "./ui/badge";
import ConnectionStatus from "./ConnectionStatus";

interface SideBarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface SidebarItem {
  id: string;
  icon: React.ElementType;
  label: string;
  proOnly?: boolean;
  adminOnly?: boolean;
}

const SideBar = ({ activeSection, onSectionChange }: SideBarProps) => {
  const { userDetails } = useAuth();
  
  const isPro = userDetails?.proStatus || false;
  const isAdmin = userDetails?.isAdmin || false;

  const sidebarItems: SidebarItem[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'charts', icon: LineChart, label: 'Charts' },
    { id: 'predictions', icon: FileText, label: 'Predictions' },
    { id: 'training', icon: Dumbbell, label: 'Training' },
    { id: 'neuralnet', icon: BrainCircuit, label: 'Neural Net' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'debug', icon: Bug, label: 'Debug' },
    { id: 'account', icon: UserCog, label: 'Account' },
    { id: 'leaderboard', icon: Trophy, label: 'Leaderboard', proOnly: true },
    { id: 'admin', icon: Shield, label: 'Admin', adminOnly: true },
  ];

  const handleClick = (id: string) => {
    onSectionChange(id);
  };

  return (
    <div 
      className="h-full bg-black border-r border-border flex flex-col"
      style={{ width: '200px', fontFamily: 'VT323, monospace' }}
    >
      <div className="px-3 py-2">
        <ConnectionStatus compact={true} className="w-full justify-center text-xs font-vt323" />
      </div>

      <div className="flex flex-col py-2 flex-1">
        {sidebarItems.map((item) => {
          // Skip if the item is pro-only and user is not pro
          if (item.proOnly && !isPro) return null;
          
          // Skip if the item is admin-only and user is not admin
          if (item.adminOnly && !isAdmin) return null;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "sidebar-item justify-start font-vt323",
                activeSection === item.id && "bg-secondary text-primary"
              )}
              onClick={() => handleClick(item.id)}
            >
              <item.icon size={18} className="mr-2" />
              <span>{item.label}</span>
              {item.proOnly && <span className="ml-auto text-xs text-primary">PRO</span>}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default SideBar;
