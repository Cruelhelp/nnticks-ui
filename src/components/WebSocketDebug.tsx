import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { persistentWebSocket } from '@/services/PersistentWebSocketService';
import { TickData } from '@/types/chartTypes'; 
import { Badge } from '@/components/ui/badge';
import WebSocketStatus from './WebSocketStatus';
import { toast } from 'sonner';
import { PlayCircle, StopCircle, Send, Trash, Download } from 'lucide-react';

interface WebSocketMessage {
  data: Record<string, unknown>;
  direction: 'in' | 'out';
  timestamp: number;
}

const WebSocketDebug: React.FC = () => {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [ticks, setTicks] = useState<TickData[]>([]);
  const [customMessage, setCustomMessage] = useState('{"ping": 1}');
  const [customSubscription, setCustomSubscription] = useState('{"ticks": "R_10"}');
  const [wsUrl, setWsUrl] = useState(localStorage.getItem('ws_url') || 'wss://ws.binaryws.com/websockets/v3?app_id=70997');
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    const handleMessage = (data: Record<string, unknown>) => {
      setMessages(prev => [...prev.slice(-99), {
        data,
        direction: 'in',
        timestamp: Date.now()
      }]);
    };
    
    const handleTick = (tick: TickData) => {
      setTicks(prev => [...prev.slice(-99), tick]);
    };
    
    persistentWebSocket.on('message', handleMessage);
    persistentWebSocket.on('tick', handleTick);
    
    setTicks(persistentWebSocket.getTicks());
    
    return () => {
      persistentWebSocket.off('message', handleMessage);
      persistentWebSocket.off('tick', handleTick);
    };
  }, []);
  
  const handleSendMessage = () => {
    try {
      const message = JSON.parse(customMessage);
      const success = persistentWebSocket.send(message);
      
      if (success) {
        setMessages(prev => [...prev.slice(-99), {
          data: message,
          direction: 'out',
          timestamp: Date.now()
        }]);
        toast.success('Message sent successfully');
      } else {
        toast.error('Failed to send message: not connected');
      }
    } catch (error) {
      toast.error('Invalid JSON: ' + (error as Error).message);
    }
  };
  
  const handleSetSubscription = () => {
    try {
      const subscription = JSON.parse(customSubscription);
      persistentWebSocket.setSubscription(subscription);
      toast.success('Subscription updated');
    } catch (error) {
      toast.error('Invalid JSON: ' + (error as Error).message);
    }
  };
  
  const handleClearMessages = () => {
    setMessages([]);
    toast.info('Messages cleared');
  };
  
  const handleClearTicks = () => {
    setTicks([]);
    persistentWebSocket.clearBuffer();
    toast.info('Ticks cleared');
  };
  
  const handleConnect = () => {
    localStorage.setItem('ws_url', wsUrl);
    persistentWebSocket.setUrl(wsUrl);
    persistentWebSocket.connect();
    toast.info('Connecting to WebSocket...');
  };
  
  const handleDisconnect = () => {
    persistentWebSocket.disconnect();
    toast.info('Disconnected from WebSocket');
  };
  
  const handleExportData = (data: WebSocketMessage[] | TickData[], filename: string) => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${filename} successfully`);
    } catch (error) {
      toast.error('Failed to export data: ' + (error as Error).message);
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">WebSocket Debugging</CardTitle>
          <WebSocketStatus showControls />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col space-y-3">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-8">
                  <Label htmlFor="wsUrl">WebSocket URL</Label>
                  <Input 
                    id="wsUrl" 
                    value={wsUrl} 
                    onChange={e => setWsUrl(e.target.value)} 
                    placeholder="WebSocket URL" 
                  />
                </div>
                <div className="col-span-4 flex items-end space-x-2">
                  <Button 
                    onClick={handleConnect} 
                    className="flex-1"
                    variant="default"
                  >
                    <PlayCircle className="h-4 w-4 mr-1.5" />
                    Connect
                  </Button>
                  <Button 
                    onClick={handleDisconnect} 
                    className="flex-1"
                    variant="outline"
                  >
                    <StopCircle className="h-4 w-4 mr-1.5" />
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="ticks">Ticks</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customSubscription">Subscription</Label>
                    <div className="flex space-x-2">
                      <Input 
                        id="customSubscription" 
                        value={customSubscription} 
                        onChange={e => setCustomSubscription(e.target.value)} 
                        placeholder='{"ticks": "R_10"}'
                      />
                      <Button onClick={handleSetSubscription}>
                        <Send className="h-4 w-4 mr-1.5" />
                        Subscribe
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customMessage">Custom Message</Label>
                    <div className="flex space-x-2">
                      <Input 
                        id="customMessage" 
                        value={customMessage} 
                        onChange={e => setCustomMessage(e.target.value)} 
                        placeholder='{"ping": 1}'
                      />
                      <Button onClick={handleSendMessage}>
                        <Send className="h-4 w-4 mr-1.5" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="text-sm font-medium mb-2">Connection Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Messages</div>
                      <div className="font-medium">{messages.length}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Ticks</div>
                      <div className="font-medium">{ticks.length}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Current Subscription</div>
                      <div className="font-medium">
                        {JSON.stringify(persistentWebSocket.getSubscription())}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Last Tick</div>
                      <div className="font-medium">
                        {persistentWebSocket.getLatestTick()?.value.toFixed(5) || 'None'}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="messages" className="space-y-2">
                <div className="flex justify-between mb-2">
                  <h3 className="text-sm font-medium">WebSocket Messages</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleClearMessages}>
                      <Trash className="h-3.5 w-3.5 mr-1.5" />
                      Clear
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleExportData(messages, `ws-messages-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`)}
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Export
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <div className="max-h-[400px] overflow-y-auto p-1">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No messages yet
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {messages.map((msg, index) => (
                          <div 
                            key={index}
                            className={`p-2 rounded-md text-xs font-mono overflow-hidden ${
                              msg.direction === 'in' 
                                ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900' 
                                : 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <Badge variant="outline">RECEIVED</Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <pre className="whitespace-pre-wrap break-all">
                              {JSON.stringify(msg.data, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="ticks" className="space-y-2">
                <div className="flex justify-between mb-2">
                  <h3 className="text-sm font-medium">Tick Data</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleClearTicks}>
                      <Trash className="h-3.5 w-3.5 mr-1.5" />
                      Clear
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleExportData(ticks, `ticks-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`)}
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Export
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <div className="max-h-[400px] overflow-y-auto">
                    {ticks.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No ticks yet
                      </div>
                    ) : (
                      <table className="w-full border-collapse">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs">Time</th>
                            <th className="px-3 py-2 text-left text-xs">Market</th>
                            <th className="px-3 py-2 text-right text-xs">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ticks.map((tick, index) => (
                            <tr key={index} className="border-t hover:bg-muted/30">
                              <td className="px-3 py-1.5 text-xs">
                                {new Date(tick.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="px-3 py-1.5 text-xs font-mono">
                                {tick.market}
                              </td>
                              <td className="px-3 py-1.5 text-xs font-mono text-right">
                                {tick.value.toFixed(5)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebSocketDebug;
