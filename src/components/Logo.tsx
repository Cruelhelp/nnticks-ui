
import { Brain, TrendingUp } from 'lucide-react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  animated?: boolean;
}

const Logo = ({ size = 24, showText = true, animated = false }: LogoProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`relative nnticks-logo ${animated ? 'animate-pulse' : ''}`}>
        <Brain 
          size={size} 
          className={`text-primary ${animated ? 'animate-pulse' : ''}`}
        />
        <TrendingUp 
          size={size * 0.6} 
          className={`absolute right-0 bottom-0 text-primary ${animated ? 'animate-bounce' : ''}`}
        />
        
        {/* Neural network connections effect */}
        {animated && (
          <svg 
            width={size * 1.2} 
            height={size * 1.2} 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-10"
            viewBox="0 0 100 100"
          >
            <circle cx="30" cy="30" r="2" className="text-primary fill-current animate-pulse" />
            <circle cx="60" cy="40" r="2" className="text-primary fill-current animate-pulse" />
            <circle cx="40" cy="70" r="2" className="text-primary fill-current animate-pulse" />
            
            <line x1="30" y1="30" x2="60" y2="40" stroke="currentColor" className="text-primary opacity-50" />
            <line x1="60" y1="40" x2="40" y2="70" stroke="currentColor" className="text-primary opacity-50" />
            <line x1="40" y1="70" x2="30" y2="30" stroke="currentColor" className="text-primary opacity-50" />
          </svg>
        )}
      </div>
      {showText && (
        <span className={`font-bold text-lg tracking-tight ${animated ? 'animate-fade-in' : ''}`}>
          <span className="text-primary">NN</span>ticks
        </span>
      )}
    </div>
  );
};

export default Logo;
