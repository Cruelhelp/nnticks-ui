
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

function App() {
  const navigate = useNavigate();

  return (
    <div className="flex">
      <UpdatedSideBar />
      <div className="p-4 w-full">
        <div className="space-y-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            onClick={() => navigate('/charts')}
          >
            <LineChart className="mr-2 h-4 w-4" />
            Charts
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
