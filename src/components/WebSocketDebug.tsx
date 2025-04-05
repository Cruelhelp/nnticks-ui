
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { persistentWebSocket } from '@/services/PersistentWebSocketService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, RefreshCw, Play, Pause, Download, Trash } from 'lucide-react';
import { toast } from 'sonner';
import WebSocketStatus from './WebSocketStatus';
import { useSettings } from '@/hooks/useSettings';

const WebSocketDebug: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [wsUrl, setWsUrl] = useState(persistentWebSocket.getStatus());
  const [customWsUrl, setCustomWsUrl] = useState('');
  const [subscription, setSubscription] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [tickCount, setTickCount] = useState(0);
  const [isCollecting, setIsCollecting] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set initial subscription from settings
    try {
      if (settings?.subscription) {
        setSubscription(settings.subscription);
      } else {
        setSubscription(JSON.stringify({ ticks: 'R_10' }, null, 2));
      }
    } catch (error) {
      console.error("Error parsing subscription:", error);
      setSubscription(JSON.stringify({ ticks: 'R_10' }, null, 2));
    }
    
    const handleMessage = (data: any) => {
      if (isCollecting) {
        setMessages(prev => {
          const newMessages = [...prev, JSON.stringify(data, null, 2)];
          return newMessages.slice(-100); // Keep only latest 100 messages
        });
      }
    };
    
    const handleTick = () => {
      setTickCount(prev => prev + 1);
    };
    
    persistentWebSocket.on('message', handleMessage);
    persistentWebSocket.on('tick', handleTick);
    
    return () => {
      persistentWebSocket.off('message', handleMessage);
      persistentWebSocket.off('tick', handleTick);
    };
  }, [settings, isCollecting]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleApplySettings = () => {
    try {
      // Update WebSocket URL if provided
      if (customWsUrl) {
        persistentWebSocket.updateConfig({ url: customWsUrl });
        setCustomWsUrl('');
        toast.success('WebSocket URL updated');
      }
      
      // Update subscription
      if (subscription) {
        const parsedSubscription = JSON.parse(subscription);
        persistentWebSocket.setSubscription(parsedSubscription);
        
        // Save to settings
        if (settings) {
          updateSettings({ ...settings, subscription });
        }
        
        toast.success('Subscription updated');
      }
    } catch (error) {
      console.error("Error applying settings:", error);
      toast.error('Failed to parse subscription. Please check the format.');
    }
  };
  
  const handleSendCustomMessage = () => {
    try {
      const parsedMessage = JSON.parse(subscription);
      persistentWebSocket.send(parsedMessage);
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to parse message. Please check the format.');
    }
  };
  
  const handleClearMessages = () => {
    setMessages([]);
    setTickCount(0);
  };
  
  const handleToggleCollection = () => {
    setIsCollecting(prev => !prev);
  };
  
  const handleExportMessages = () => {
    try {
      const dataStr = JSON.stringify(messages, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileName = `websocket-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
      
      toast.success('Messages exported successfully');
    } catch (error) {
      toast.error('Failed to export messages');
    }
  };
  
  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast.success('Copied to clipboard');
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>WebSocket Debug</CardTitle>
            <CardDescription>Monitor and control the WebSocket connection</CardDescription>
          </div>
          <WebSocketStatus showControls showTickInfo />
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="connection">
          <TabsList className="mb-4">
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="messages">Messages ({messages.length})</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connection" className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="ws-url">Current WebSocket URL</Label>
              <Input
                id="ws-url"
                value={persistentWebSocket['config'].url}
                disabled
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="custom-ws-url">Custom WebSocket URL</Label>
              <Input
                id="custom-ws-url"
                placeholder="wss://example.com/ws"
                value={customWsUrl}
                onChange={(e) => setCustomWsUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Default: wss://ws.binaryws.com/websockets/v3?app_id=70997
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label>Connection Status</Label>
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <WebSocketStatus />
                <div className="ml-auto">
                  <Button 
                    size="sm" 
                    onClick={() => persistentWebSocket.connect()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reconnect
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>Statistics</Label>
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                <div>
                  <p className="text-sm font-medium">Ticks Received</p>
                  <p className="text-2xl font-bold">{tickCount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Messages Logged</p>
                  <p className="text-2xl font-bold">{messages.length}</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="messages">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Real-time Messages</Label>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleToggleCollection}
                  >
                    {isCollecting ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleClearMessages}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleExportMessages}
                    disabled={messages.length === 0}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-[400px] border rounded-md p-2 bg-muted/10">
                {messages.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">
                    No messages received yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((message, index) => (
                      <div 
                        key={index} 
                        className="p-2 border rounded bg-card text-sm font-mono relative group"
                      >
                        <pre className="whitespace-pre-wrap overflow-auto break-all max-h-24">
                          {message}
                        </pre>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6"
                          onClick={() => handleCopyMessage(message)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="subscription" className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="subscription">Custom Subscription / Message</Label>
              <Textarea
                id="subscription"
                className="font-mono text-sm min-h-32"
                placeholder='{ "ticks": "R_100" }'
                value={subscription}
                onChange={(e) => setSubscription(e.target.value)}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Enter a JSON object to subscribe to ticks or send custom message
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleSendCustomMessage}
              >
                Send Custom Message
              </Button>
              <Button onClick={handleApplySettings}>
                Apply Subscription
              </Button>
            </div>
            
            <div className="border rounded-md p-4 bg-muted/10">
              <p className="text-sm font-medium mb-2">Common Subscriptions</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSubscription(JSON.stringify({ ticks: 'R_10' }, null, 2))}
                >
                  Volatility 10
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSubscription(JSON.stringify({ ticks: 'R_25' }, null, 2))}
                >
                  Volatility 25
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSubscription(JSON.stringify({ ticks: 'R_50' }, null, 2))}
                >
                  Volatility 50
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSubscription(JSON.stringify({ ticks: 'R_75' }, null, 2))}
                >
                  Volatility 75
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSubscription(JSON.stringify({ ticks: 'R_100' }, null, 2))}
                >
                  Volatility 100
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSubscription(JSON.stringify({ forget_all: 'ticks' }, null, 2))}
                >
                  Unsubscribe All
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          App ID: 70997 | API Key: 7KKDlK9AUf3WNM3
        </div>
        <Button 
          variant="default" 
          onClick={() => {
            persistentWebSocket.disconnect();
            setTimeout(() => persistentWebSocket.connect(), 1000);
          }}
        >
          Restart Connection
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WebSocketDebug;
