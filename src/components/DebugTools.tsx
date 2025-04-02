
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings } from '@/hooks/useSettings';
import { useWebSocket, subscriptionFormats } from '@/hooks/useWebSocket';
import { toast } from 'sonner';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  TerminalSquare, 
  BarChart3,
  Shield,
  Database
} from 'lucide-react';

const DebugTools = () => {
  const { settings, updateSettings } = useSettings();
  const [localWsUrl, setLocalWsUrl] = useState(settings.wsUrl);
  const [localSubscription, setLocalSubscription] = useState(settings.subscription);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [logs, setLogs] = useState<string[]>([]);
  const [connectionCount, setConnectionCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [tickCount, setTickCount] = useState(0);
  const [selectedBroker, setSelectedBroker] = useState('deriv');
  
  // WebSocket connection
  const { 
    isConnected,
    ticks,
    latestTick, 
    error, 
    reconnectCount,
    connect,
    disconnect,
    send
  } = useWebSocket({
    wsUrl: settings.wsUrl,
    subscription: JSON.parse(settings.subscription),
    autoReconnect: autoReconnect,
    maxReconnectAttempts: maxAttempts,
    onOpen: () => {
      addLog('info', 'Connection established');
      setConnectionCount(prev => prev + 1);
    },
    onMessage: (data) => {
      if (!data.tick && !data.ping) {
        addLog('message', `Data received: ${JSON.stringify(data).substring(0, 100)}...`);
      }
      setTickCount(prev => prev + 1);
    },
    onError: (error) => {
      addLog('error', `Connection error: ${error}`);
      setErrorCount(prev => prev + 1);
    },
    onClose: () => {
      addLog('info', 'Connection closed');
    }
  });

  // Add log entry
  const addLog = (type: 'info' | 'error' | 'message', message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`${timestamp} [${type}] ${message}`, ...prev].slice(0, 100));
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    toast.info('Logs cleared');
  };

  // Apply connection settings
  const applySettings = async () => {
    try {
      await updateSettings({
        wsUrl: localWsUrl,
        subscription: localSubscription
      });
      
      addLog('info', 'Settings applied successfully');
      toast.success('Connection settings updated');
    } catch (error) {
      console.error('Failed to update settings:', error);
      addLog('error', `Failed to update settings: ${error}`);
      toast.error('Failed to update settings');
    }
  };

  // Connect to WebSocket
  const handleConnect = () => {
    disconnect();
    setConnectionCount(0);
    setErrorCount(0);
    setTickCount(0);
    setTimeout(() => {
      connect();
    }, 500);
  };

  // Disconnect from WebSocket
  const handleDisconnect = () => {
    disconnect();
    addLog('info', 'Manually disconnected from WebSocket');
    toast.info('WebSocket disconnected');
  };

  // Handle broker selection
  const handleBrokerSelect = (broker: string) => {
    setSelectedBroker(broker);
    const format = subscriptionFormats[broker as keyof typeof subscriptionFormats];
    setLocalSubscription(JSON.stringify(format));
  };

  // Reset connection stats
  const resetStats = () => {
    setConnectionCount(0);
    setErrorCount(0);
    setTickCount(0);
    toast.info('Connection stats reset');
  };
  
  // Max connection attempts failsafe
  useEffect(() => {
    if (connectionCount > 50) {
      disconnect();
      toast.error('Connection attempts limit reached (50). Connection stopped for safety.');
      addLog('error', 'Connection attempts limit reached (50). Connection stopped for safety.');
    }
  }, [connectionCount, disconnect]);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Debug Tools</h2>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                <Wifi className="h-3 w-3 mr-1" /> Connected
              </Badge>
              <Button variant="destructive" size="sm" onClick={handleDisconnect}>Disconnect</Button>
            </>
          ) : (
            <>
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                <WifiOff className="h-3 w-3 mr-1" /> Disconnected
              </Badge>
              <Button variant="default" size="sm" onClick={handleConnect}>Connect</Button>
            </>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="connection">
        <TabsList>
          <TabsTrigger value="connection"><Wifi className="h-4 w-4 mr-2" /> Connection</TabsTrigger>
          <TabsTrigger value="logs"><TerminalSquare className="h-4 w-4 mr-2" /> Logs</TabsTrigger>
          <TabsTrigger value="data"><Database className="h-4 w-4 mr-2" /> Data</TabsTrigger>
          <TabsTrigger value="admin"><Shield className="h-4 w-4 mr-2" /> Admin</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WebSocket Connection</CardTitle>
              <CardDescription>Configure and manage WebSocket connection settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="broker">Broker</Label>
                  <Select value={selectedBroker} onValueChange={handleBrokerSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select broker" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deriv">Deriv</SelectItem>
                      <SelectItem value="iqOption">IQ Option</SelectItem>
                      <SelectItem value="binance">Binance</SelectItem>
                      <SelectItem value="metatrader">MetaTrader</SelectItem>
                      <SelectItem value="binary">Binary.com</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wsurl">WebSocket URL</Label>
                  <Input 
                    id="wsurl" 
                    value={localWsUrl} 
                    onChange={(e) => setLocalWsUrl(e.target.value)}
                    placeholder="wss://example.com/websocket"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subscription">Subscription Format</Label>
                  <Input 
                    id="subscription" 
                    value={localSubscription} 
                    onChange={(e) => setLocalSubscription(e.target.value)}
                    placeholder='{"ticks":"R_10"}'
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-attempts">Max Reconnect Attempts</Label>
                  <Select 
                    value={maxAttempts.toString()} 
                    onValueChange={(value) => setMaxAttempts(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select max attempts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 attempts</SelectItem>
                      <SelectItem value="5">5 attempts</SelectItem>
                      <SelectItem value="10">10 attempts</SelectItem>
                      <SelectItem value="20">20 attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-reconnect"
                  checked={autoReconnect}
                  onCheckedChange={setAutoReconnect}
                />
                <Label htmlFor="auto-reconnect">Auto Reconnect</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={resetStats}>Reset Stats</Button>
                <Button variant="outline" onClick={applySettings}>Apply Settings</Button>
                <Button onClick={handleConnect}>Connect</Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Connection Status</div>
                    <div className="text-lg font-semibold flex items-center mt-1">
                      {isConnected ? (
                        <>
                          <Wifi className="h-4 w-4 mr-1 text-green-500" />
                          <span className="text-green-500">Online</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-4 w-4 mr-1 text-red-500" />
                          <span className="text-red-500">Offline</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Connection Count</div>
                    <div className="text-lg font-semibold mt-1">{connectionCount}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Error Count</div>
                    <div className="text-lg font-semibold mt-1 text-red-500">{errorCount}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Ticks Received</div>
                    <div className="text-lg font-semibold mt-1">{tickCount}</div>
                  </CardContent>
                </Card>
              </div>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-md flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Connection Error</p>
                    <p className="text-sm opacity-90">{error.message}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Connection Logs</CardTitle>
                <CardDescription>Real-time logs of WebSocket activity</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={clearLogs}>Clear</Button>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-auto border rounded-md p-4 bg-black text-green-400 font-mono text-sm">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground text-center py-4">No logs yet</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log.includes('[error]') ? (
                        <span className="text-red-400">{log}</span>
                      ) : log.includes('[message]') ? (
                        <span className="text-blue-400">{log}</span>
                      ) : (
                        <span>{log}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Market Data</CardTitle>
              <CardDescription>Latest tick data received from WebSocket</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>Latest tick received: {ticks.length > 0 ? 'Yes' : 'No'}</div>
                  <div>Total ticks: {ticks.length}</div>
                </div>
                
                {latestTick && (
                  <div className="space-y-2">
                    <div className="font-medium">Latest Tick</div>
                    <div className="bg-muted p-4 rounded-md">
                      <div><span className="font-medium">Time:</span> {new Date(latestTick.timestamp).toLocaleTimeString()}</div>
                      <div><span className="font-medium">Market:</span> {latestTick.market}</div>
                      <div><span className="font-medium">Value:</span> {latestTick.value}</div>
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="font-medium mb-2">Recent Ticks</div>
                  <div className="h-64 overflow-auto border rounded-md">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left p-2">Time</th>
                          <th className="text-left p-2">Market</th>
                          <th className="text-left p-2">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticks.slice().reverse().map((tick, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{new Date(tick.timestamp).toLocaleTimeString()}</td>
                            <td className="p-2">{tick.market}</td>
                            <td className="p-2">{tick.value}</td>
                          </tr>
                        ))}
                        {ticks.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-4 text-center text-muted-foreground">
                              No tick data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>Admin Tools</CardTitle>
              <CardDescription>Advanced administrative functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Debug Mode</h3>
                  <div className="flex items-center space-x-2">
                    <Switch id="debug-mode" />
                    <Label htmlFor="debug-mode">Enable Debug Mode</Label>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Show detailed technical information in the application
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Performance Monitoring</h3>
                  <div className="flex items-center space-x-2">
                    <Switch id="perf-monitor" defaultChecked />
                    <Label htmlFor="perf-monitor">Monitor Performance</Label>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track and log application performance metrics
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">WebSocket Options</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="ws-compression" />
                      <Label htmlFor="ws-compression">Enable WebSocket Compression</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="ping-pong" defaultChecked />
                      <Label htmlFor="ping-pong">Enable Ping/Pong Messages</Label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button variant="destructive">Reset All Application Data</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DebugTools;
