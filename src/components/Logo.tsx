
import { Brain, TrendingUp } from 'lucide-react';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

const Logo = ({ size = 24, showText = true }: LogoProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative nnticks-logo">
        <Brain size={size} className="text-primary" />
        <TrendingUp 
          size={size * 0.6} 
          className="absolute right-0 bottom-0 text-primary" 
        />
      </div>
      {showText && (
        <span className="font-bold text-lg tracking-tight">
          <span className="text-primary">NN</span>ticks
        </span>
      )}
    </div>
  );
};

export default Logo;
