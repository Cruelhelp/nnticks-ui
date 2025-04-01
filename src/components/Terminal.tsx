
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Resizable } from 'react-resizable-panels';
import { X, Minus, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';

interface TerminalProps {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ onClose, onMinimize, onMaximize }) => {
  const [history, setHistory] = useState<string[]>([
    'NNticks Terminal v1.0.0',
    'Type "help" for available commands',
    ''
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { settings } = useSettings();
  const { user, userDetails } = useAuth();
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Focus input when terminal is shown
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Scroll to bottom when history changes
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add command to history
    const newHistory = [...history, `> ${input}`];
    
    // Process command
    const response = processCommand(input.trim());
    if (response) {
      newHistory.push(...response.split('\n'));
    }
    
    // Add empty line
    newHistory.push('');
    
    setHistory(newHistory);
    setCommandHistory(prev => [input, ...prev]);
    setInput('');
    setHistoryIndex(-1);
  };
  
  const processCommand = (command: string): string => {
    const cmd = command.toLowerCase();
    const args = cmd.split(' ').filter(arg => arg.length > 0);
    
    switch (args[0]) {
      case 'help':
        return `
Available commands:
  help                  - Show this help
  clear                 - Clear terminal
  status                - Show system status
  whoami                - Show current user
  market [symbol]       - Show market data
  predict [rise|fall]   - Make a prediction
  train                 - Train neural network
  version               - Show version info
  exit                  - Close terminal
`;
      case 'clear':
        setTimeout(() => {
          setHistory([
            'NNticks Terminal v1.0.0',
            'Type "help" for available commands',
            ''
          ]);
        }, 10);
        return '';
      case 'status':
        return `
System Status:
  CPU: 23% | Memory: 512MB | Uptime: ${Math.floor(Date.now() / 1000) % 86400}s
  Neural Network: Active | Predictions: ${Math.floor(Math.random() * 100)} | Accuracy: ${65 + Math.floor(Math.random() * 25)}%
  Connection: Binary.com (R_10) | Latency: ${10 + Math.floor(Math.random() * 20)}ms
`;
      case 'whoami':
        return userDetails?.username
          ? `Current user: ${userDetails.username} | Pro: ${userDetails.proStatus ? 'Yes' : 'No'} | Admin: ${userDetails.isAdmin ? 'Yes' : 'No'}`
          : 'Not logged in';
      case 'market':
        const symbol = args[1] || 'R_10';
        return `
Market data for ${symbol.toUpperCase()}:
  Current price: ${100 + (Math.random() * 10).toFixed(5)}
  24h change: ${(Math.random() * 2 - 1).toFixed(2)}%
  Volatility: ${(Math.random() * 5 + 1).toFixed(2)}
  RSI: ${Math.floor(30 + Math.random() * 40)}
`;
      case 'predict':
        const direction = args[1] || (Math.random() > 0.5 ? 'rise' : 'fall');
        const confidence = Math.floor(50 + Math.random() * 40);
        return `
Prediction generated:
  Direction: ${direction.toUpperCase()}
  Confidence: ${confidence}%
  Timeframe: 3 ticks
  Market: R_10
  
Running neural model...
Analyzing market patterns...
Computing probabilities...

Prediction registered. Track results in Predictions tab.
`;
      case 'train':
        return `
Starting neural network training...
Epochs: 100 | Batch size: 32 | Learning rate: 0.001

Progress: [----------] 0%
         [#---------] 10%
         [###-------] 30%
         [#####-----] 50%
         [#######---] 70%
         [#########-] 90%
         [##########] 100%

Training complete!
Accuracy: ${75 + Math.floor(Math.random() * 15)}%
Loss: ${(0.1 + Math.random() * 0.2).toFixed(4)}

Model saved as "model_${Date.now()}.nnt"
`;
      case 'version':
        return `
NNticks Terminal v1.0.0
Neural Network Core: v2.3.4
Market Connector: v1.1.2
Prediction Engine: v3.0.1

License: Pro${userDetails?.proStatus ? '' : ' (Trial)'}
`;
      case 'exit':
        onClose();
        return 'Closing terminal...';
      default:
        return `Command not found: ${args[0]}. Type "help" for available commands.`;
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Use custom terminal height from settings
  const terminalHeight = settings.terminalHeight || 250;
  
  return (
    <Resizable
      axis="y"
      minConstraints={[window.innerWidth, 100]}
      maxConstraints={[window.innerWidth, 500]}
      onResize={(e, data) => {
        // You can save the new height in settings if needed
      }}
      height={isCollapsed ? 40 : terminalHeight}
      className="w-full"
    >
      <Card className="border-t-2 border-t-primary w-full rounded-b-none">
        <div className="flex justify-between items-center p-2 bg-black text-white border-b border-gray-800">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 text-center text-sm font-medium text-gray-400">Terminal</div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 hover:bg-gray-800" 
              onClick={toggleCollapse}
            >
              {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 hover:bg-gray-800" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {!isCollapsed && (
          <div className="p-3 bg-black text-green-400 h-full overflow-hidden flex flex-col">
            <div 
              ref={terminalRef}
              className="terminal-font flex-1 overflow-auto whitespace-pre-wrap"
              style={{ height: terminalHeight - 80, maxHeight: '100%' }}
            >
              {history.map((line, index) => (
                <div key={index} className="terminal-line">
                  {line}
                </div>
              ))}
            </div>
            
            <form onSubmit={handleSubmit} className="flex items-center mt-2">
              <span className="text-green-500 mr-2 terminal-font">$</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent terminal-font outline-none text-green-400 caret-green-400"
                autoFocus
              />
              <span className="w-2 h-4 bg-green-400 opacity-80 cursor-blink ml-1"></span>
            </form>
          </div>
        )}
      </Card>
    </Resizable>
  );
};

export default Terminal;
