
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { X, Minus, ChevronDown, ChevronUp, Shield, User, User2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface TerminalProps {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}

interface AdminUser {
  id: string;
  email: string;
  username: string;
  created_at: string;
  pro_status: boolean;
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
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedTab, setSelectedTab] = useState('users');
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
  admin                 - Access admin panel
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
  WebSocket: Connected
`;
      case 'whoami':
        return userDetails?.username
          ? `Current user: ${userDetails.username} | Pro: ${userDetails.proStatus ? 'Yes' : 'No'} | Admin: ${userDetails.isAdmin ? 'Yes' : 'No'}`
          : 'Not logged in';
      case 'market':
        const symbol = args[1] || 'R_10';
        return `
Market data for ${symbol.toUpperCase()}:
  Current price: ${(6000 + Math.random() * 0.99).toFixed(2)}
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

© 2025 Ruel McNeil. All rights reserved.
`;
      case 'admin':
        setShowAdminPanel(true);
        return 'Opening admin panel...';
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
  const terminalHeight = settings?.terminalHeight || 250;

  // Admin panel authentication
  const handleAdminLogin = () => {
    if (adminPassword === 'Mastermind@123') {
      setIsAuthenticated(true);
      fetchUsers();
      toast.success("Admin authenticated successfully");
    } else {
      toast.error("Invalid admin password");
    }
  };

  // Fetch users for admin panel
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users_extra')
        .select('*');

      if (error) throw error;
      
      if (data) {
        const formattedUsers = data.map((user: any) => ({
          id: user.user_id,
          email: user.email || 'No email',
          username: user.username,
          created_at: new Date(user.created_at).toLocaleDateString(),
          pro_status: user.pro_status
        }));
        
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  // Set user to pro status
  const setUserPro = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users_extra')
        .update({ pro_status: true })
        .eq('user_id', userId);

      if (error) throw error;
      
      // Update the users list
      setUsers(users.map(user => {
        if (user.id === userId) {
          return { ...user, pro_status: true };
        }
        return user;
      }));
      
      toast.success('User upgraded to Pro successfully');
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast.error('Failed to upgrade user');
    }
  };
  
  return (
    <div className="w-full" style={{ height: isCollapsed ? '40px' : `${terminalHeight}px` }}>
      <Card className="border-t-2 border-t-primary w-full rounded-b-none h-full flex flex-col">
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
          <div className="p-3 bg-black text-green-400 flex-1 overflow-hidden flex flex-col font-mono">
            <div 
              ref={terminalRef}
              className="terminal-font flex-1 overflow-auto whitespace-pre-wrap"
              style={{ maxHeight: 'calc(100% - 30px)' }}
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

      {/* Admin Panel Dialog */}
      <Dialog open={showAdminPanel} onOpenChange={setShowAdminPanel}>
        <DialogContent className="sm:max-w-[700px] bg-black border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-primary" /> 
              Admin Control Panel
            </DialogTitle>
            <DialogDescription>
              Secure administrator interface for system management
            </DialogDescription>
          </DialogHeader>

          {!isAuthenticated ? (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm mb-2">Please enter admin password to continue</p>
                <div className="flex gap-2">
                  <Input 
                    type="password" 
                    placeholder="Admin password" 
                    value={adminPassword} 
                    onChange={(e) => setAdminPassword(e.target.value)} 
                    className="bg-gray-900"
                  />
                  <Button onClick={handleAdminLogin}>Login</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-2">
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="mb-4 bg-gray-900">
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="system">System</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="users" className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.created_at}</TableCell>
                          <TableCell>
                            {user.pro_status ? 
                              <Badge className="bg-primary">PRO</Badge> : 
                              <Badge variant="outline">Free</Badge>
                            }
                          </TableCell>
                          <TableCell>
                            {!user.pro_status && (
                              <Button size="sm" onClick={() => setUserPro(user.id)}>
                                Upgrade to Pro
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="system">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">System Status</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-900 p-3 rounded-md">
                          <p className="text-xs text-gray-400">CPU Usage</p>
                          <p className="text-lg">24%</p>
                        </div>
                        <div className="bg-gray-900 p-3 rounded-md">
                          <p className="text-xs text-gray-400">Memory</p>
                          <p className="text-lg">512MB</p>
                        </div>
                        <div className="bg-gray-900 p-3 rounded-md">
                          <p className="text-xs text-gray-400">WebSocket</p>
                          <p className="text-lg">Connected</p>
                        </div>
                        <div className="bg-gray-900 p-3 rounded-md">
                          <p className="text-xs text-gray-400">Model Status</p>
                          <p className="text-lg">Active</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">System Controls</h4>
                      <div className="flex gap-2">
                        <Button variant="outline">Restart Service</Button>
                        <Button variant="outline">Clear Cache</Button>
                        <Button variant="destructive">Emergency Stop</Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="logs">
                  <div className="bg-gray-900 p-3 rounded-md font-mono text-xs h-[300px] overflow-auto">
                    <p>[2025-06-15 08:32:14] INFO: System started</p>
                    <p>[2025-06-15 08:45:22] INFO: WebSocket connection established</p>
                    <p>[2025-06-15 08:47:01] INFO: User login detected</p>
                    <p>[2025-06-15 09:01:33] WARNING: High CPU usage detected</p>
                    <p>[2025-06-15 09:10:44] INFO: Neural network training started</p>
                    <p>[2025-06-15 09:15:37] INFO: Training completed with 93% accuracy</p>
                    <p>[2025-06-15 09:22:16] INFO: Prediction made: RISE with 82% confidence</p>
                    <p>[2025-06-15 09:35:29] INFO: Prediction result: SUCCESS</p>
                    <p>[2025-06-15 09:45:12] INFO: Market data updated</p>
                    <p>[2025-06-15 09:55:48] INFO: User logout detected</p>
                    <p>[2025-06-15 10:05:21] INFO: System maintenance started</p>
                    <p>[2025-06-15 10:10:57] INFO: Maintenance completed</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Terminal;
