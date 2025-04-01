
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Progress } from '@/components/ui/progress';

const Splash = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Simulate loading
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            navigate('/');
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="animate-fade-in">
          <Logo size={96} />
        </div>
        
        <div className="mt-8 w-full px-4">
          <Progress value={progress} className="h-2" />
        </div>
        
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">
          Loading NNticks...
        </p>
        
        <p className="mt-16 text-xs text-muted-foreground">
          Copyright © 2025 Ruel McNeil
        </p>
      </div>
    </div>
  );
};

export default Splash;
