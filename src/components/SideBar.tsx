
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Home, LineChart, PieChart, Dumbbell, History, Trophy, Settings, Shield, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/hooks/useSettings";

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
  const { settings } = useSettings();
  
  const isPro = userDetails?.proStatus || false;
  const isAdmin = userDetails?.isAdmin || false;

  const sidebarItems: SidebarItem[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'charts', icon: LineChart, label: 'Charts' },
    { id: 'predictions', icon: FileText, label: 'Predictions' },
    { id: 'training', icon: Dumbbell, label: 'Training' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'leaderboard', icon: Trophy, label: 'Leaderboard', proOnly: true },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'admin', icon: Shield, label: 'Admin', adminOnly: true },
  ];

  const handleClick = (id: string) => {
    onSectionChange(id);
  };

  return (
    <div 
      className="h-full bg-sidebar border-r border-border"
      style={{ width: `${settings.sidebarWidth}px` }}
    >
      <div className="flex flex-col py-2">
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
                "sidebar-item justify-start",
                activeSection === item.id && "bg-secondary text-primary"
              )}
              onClick={() => handleClick(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.proOnly && <span className="ml-auto text-xs text-primary">PRO</span>}
            </Button>
          );
        })}
      </div>
      
      <div className="mt-auto p-2 border-t border-border text-center text-xs text-muted-foreground">
        Copyright © 2025 Ruel McNeil
      </div>
    </div>
  );
};

export default SideBar;
