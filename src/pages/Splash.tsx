import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Progress } from '@/components/ui/progress';
import { Brain, ChevronRight, LineChart, GitBranch, Network, Database } from 'lucide-react';

const Splash = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentIcon, setCurrentIcon] = useState(0);
  const icons = [Brain, LineChart, GitBranch, Network, Database];
  
  useEffect(() => {
    // Simulate loading
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 3;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            navigate('/');
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 80);
    
    // Rotate through icons
    const iconInterval = setInterval(() => {
      setCurrentIcon(prev => (prev + 1) % icons.length);
    }, 800);
    
    return () => {
      clearInterval(interval);
      clearInterval(iconInterval);
    }
  }, [navigate, icons.length]);
  
  // Animation for loading messages
  const messages = useMemo(() => [
    'Initializing neural network',
    'Connecting to market data',
    'Loading predictive models',
    'Preparing analysis tools',
    'Setting up trading environment'
  ], []);
  
  const [loadingMessage, setLoadingMessage] = useState(messages[0]);
  
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setLoadingMessage(prev => {
        const currentIndex = messages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % messages.length;
        return messages[nextIndex];
      });
    }, 1500);
    
    return () => clearInterval(messageInterval);
  }, [messages]);
  
  const IconComponent = icons[currentIcon];
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="animate-fade-in flex flex-col items-center">
          <div className="mb-4 relative">
            <Logo size={96} />
            <div className="absolute -right-8 -bottom-8 p-2 rounded-full bg-background animate-pulse">
              <IconComponent size={24} className="text-primary" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight mb-1">NNticks</h1>
          <p className="text-muted-foreground mb-8">Neural Network Predictions for Financial Markets</p>
        </div>
        
        <div className="mt-8 w-full px-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Loading resources</span>
            <span>{progress}%</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          {loadingMessage}...
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-12 animate-fade-in">
          {[Brain, LineChart, Network].map((Icon, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon size={20} className="text-primary" />
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {i === 0 ? 'Neural AI' : i === 1 ? 'Market Data' : 'Real-time'}
              </span>
            </div>
          ))}
        </div>
        
        <p className="mt-16 text-xs text-muted-foreground">
          Copyright 2025 Ruel McNeil
        </p>
      </div>
    </div>
  );
};

export default Splash;
