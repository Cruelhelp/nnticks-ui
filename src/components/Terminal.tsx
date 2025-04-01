
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { MinusSquare, Maximize2, X } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';

interface TerminalProps {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}

interface TerminalHistory {
  type: 'input' | 'output' | 'error' | 'success';
  content: string;
  timestamp: string;
}

const Terminal = ({ onClose, onMinimize, onMaximize }: TerminalProps) => {
  const { settings } = useSettings();
  const { user, userDetails } = useAuth();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<TerminalHistory[]>([
    { type: 'output', content: 'NNticks Terminal v1.0.0', timestamp: new Date().toISOString() },
    { type: 'output', content: 'Type "help" for a list of commands', timestamp: new Date().toISOString() },
  ]);
  const [adminMode, setAdminMode] = useState(false);
  const [isCursorVisible, setIsCursorVisible] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  const username = userDetails?.username || 'guest';

  // Scroll to bottom of terminal when history updates
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);
  
  // Blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setIsCursorVisible(prev => !prev);
    }, 500);
    
    return () => clearInterval(cursorInterval);
  }, []);
  
  // Available commands
  const commands: { [key: string]: (args: string[]) => string } = {
    help: () => `
Available commands:
- help: Show this help message
- clear: Clear terminal history
- start_training: Start neural network training
- predict_now: Generate a prediction
- show_accuracy: Show current model accuracy
- export_history: Export trading history
${adminMode || userDetails?.isAdmin ? '- admin: Access admin panel' : ''}
    `,
    clear: () => {
      setHistory([]);
      return '';
    },
    start_training: () => {
      if (user) {
        return 'Starting training session...';
      } else {
        return 'Error: You must be logged in to train the neural network';
      }
    },
    predict_now: () => 'Generating prediction...please wait',
    show_accuracy: () => {
      const accuracy = Math.random() * 30 + 65;
      return `Current model accuracy: ${accuracy.toFixed(2)}%`;
    },
    export_history: () => {
      if (userDetails?.proStatus) {
        return 'Exporting trading history as PDF...';
      } else {
        return 'Error: This feature requires a Pro subscription';
      }
    },
    admin: (args) => {
      if (userDetails?.isAdmin) {
        return `
Admin panel:
1: Track users
2: Delete user
3: Ban user
4: Create user
5: Promote to admin
6: Grant Pro status
7: Debug backend
8: Change PayPal email
        `;
      } else if (args.length > 0 && args[0] === 'Mastermind@123') {
        setAdminMode(true);
        return 'Admin mode activated';
      } else {
        return 'Error: Incorrect admin password';
      }
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user input to history
    const newInput: TerminalHistory = {
      type: 'input',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setHistory(prev => [...prev, newInput]);
    
    // Parse command
    const parts = input.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    // Execute command and add output to history
    setTimeout(() => {
      let outputContent: string;
      let outputType: 'output' | 'error' | 'success' = 'output';
      
      if (command in commands) {
        try {
          outputContent = commands[command](args);
          
          // Special actions for some commands
          if (command === 'predict_now') {
            toast.info('Prediction generated! Check predictions panel.');
          } else if (command === 'export_history' && userDetails?.proStatus) {
            toast.success('History exported successfully');
          }
          
          outputType = 'success';
        } catch (error) {
          outputContent = `Error executing command: ${error}`;
          outputType = 'error';
        }
      } else {
        outputContent = `Command not found: ${command}`;
        outputType = 'error';
      }
      
      if (outputContent) {
        setHistory(prev => [...prev, {
          type: outputType,
          content: outputContent,
          timestamp: new Date().toISOString()
        }]);
      }
    }, 100);
    
    // Clear input
    setInput('');
  };

  return (
    <div 
      className="flex flex-col bg-card border-t border-border"
      style={{ height: `${settings.terminalHeight}px` }}
    >
      <div className="flex items-center justify-between p-1 bg-muted border-b border-border">
        <span className="text-xs text-muted-foreground px-2">Terminal</span>
        <div className="flex">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMinimize}>
            <MinusSquare size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMaximize}>
            <Maximize2 size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>
      </div>
      
      <div 
        ref={terminalRef}
        className="flex-1 overflow-auto p-2 font-mono text-sm bg-black text-green-500"
        style={{ fontFamily: settings.font }}
      >
        {history.map((entry, i) => (
          <div key={i} className="mb-1">
            {entry.type === 'input' ? (
              <div>
                <span className="text-blue-400">{username}@terminal&gt;</span> {entry.content}
              </div>
            ) : (
              <div className={
                entry.type === 'error' ? 'text-red-400' : 
                entry.type === 'success' ? 'text-green-400' : 
                'text-gray-400'
              }>
                {entry.content}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="flex border-t border-border bg-black p-2">
        <div className="text-blue-400 font-mono text-sm mr-1">{username}@terminal&gt;</div>
        <div className="flex-1 flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-green-500 font-mono text-sm"
            style={{ fontFamily: settings.font }}
          />
          <div className={`h-full w-2 bg-green-500 ${isCursorVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}></div>
        </div>
      </form>
    </div>
  );
};

export default Terminal;
