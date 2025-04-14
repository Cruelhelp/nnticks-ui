
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Home,
  Brain,
  History,
  Trophy,
  Settings,
  Terminal,
  Clock,
  Info,
  Shield
} from 'lucide-react';
import UpdatedSideBar from './UpdatedSideBar';

interface SideBarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

function SideBar({ activeSection, onSectionChange }: SideBarProps) {
  return (
    <div className="flex">
      <UpdatedSideBar 
        activeSection={activeSection} 
        onSectionChange={onSectionChange} 
      />
    </div>
  );
}

export default SideBar;
