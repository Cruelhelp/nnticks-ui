
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings } from '@/hooks/useSettings';
import { useWebSocketClient } from '@/hooks/useWebSocketClient';
import { WebSocketService } from '@/services/WebSocketService'; 
import { toast } from 'sonner';
import { subscriptionFormats } from '@/hooks/useWebSocket';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  TerminalSquare, 
  BarChart3,
  Shield,
  Database
} from 'lucide-react';
import ConnectionStatus from './ConnectionStatus';

const DebugTools = () => {
  const { settings, updateSettings } = useSettings();
  const [localWsUrl, setLocalWsUrl] = useState(settings.wsUrl || "wss://ws.binaryws.com/websockets/v3?app_id=1089");
  const [localSubscription, setLocalSubscription] = useState(settings.subscription || JSON.stringify({ ticks: 'R_10' }));
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [logs, setLogs] = useState<string[]>([]);
  const [connectionCount, setConnectionCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [tickCount, setTickCount] = useState(0);
  const [selectedBroker, setSelectedBroker] = useState('deriv');
  
  const { 
    isConnected,
    connectionStatus,
    ticks,
    latestTick,
    hasRecentData,
    connect,
    disconnect
  } = useWebSocketClient({
    onMessage: (data) => {
      if (!data.tick && !data.ping) {
        addLog('message', `Data received: ${JSON.stringify(data).substring(0, 100)}...`);
      }
      setTickCount(prev => prev + 1);
    },
    onTick: () => {
      // Handle tick updates
    },
    onStatusChange: (status) => {
      if (status === 'connected') {
        addLog('info', 'Connection established');
        setConnectionCount(prev => prev + 1);
      } else if (status === 'disconnected') {
        addLog('info', 'Connection closed');
      }
    },
    onError: (error) => {
      addLog('error', `Connection error: ${error}`);
      setErrorCount(prev => prev + 1);
    }
  });

  const addLog = (type: 'info' | 'error' | 'message', message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`${timestamp} [${type}] ${message}`, ...prev].slice(0, 100));
  };

  const clearLogs = () => {
    setLogs([]);
    toast.info('Logs cleared');
  };

  const applySettings = async () => {
    try {
      await updateSettings({
        wsUrl: localWsUrl,
        subscription: localSubscription
      });
      
      // Update WebSocket service
      WebSocketService.updateConfig({
        url: localWsUrl,
        subscription: JSON.parse(localSubscription)
      });
      
      addLog('info', 'Settings applied successfully');
      toast.success('Connection settings updated');
    } catch (error) {
      console.error('Failed to update settings:', error);
      addLog('error', `Failed to update settings: ${error}`);
      toast.error('Failed to update settings');
    }
  };

  const handleConnect = () => {
    disconnect();
    
    const saveToast = toast.loading('Connecting to WebSocket...');
    setConnectionCount(0);
    setErrorCount(0);
    setTickCount(0);
    
    // Update WebSocket service
    WebSocketService.updateConfig({
      url: localWsUrl,
      subscription: JSON.parse(localSubscription)
    });
    
    setTimeout(() => {
      connect();
      toast.dismiss(saveToast);
    }, 500);
  };

  const handleDisconnect = () => {
    disconnect();
    addLog('info', 'Manually disconnected from WebSocket');
  };

  const handleBrokerSelect = (broker: string) => {
    setSelectedBroker(broker);
    const format = subscriptionFormats[broker as keyof typeof subscriptionFormats];
    setLocalSubscription(JSON.stringify(format));
  };

  const resetStats = () => {
    setConnectionCount(0);
    setErrorCount(0);
    setTickCount(0);
    toast.info('Connection stats reset');
  };
  
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
          <ConnectionStatus />
          {isConnected ? (
            <Button variant="destructive" size="sm" onClick={handleDisconnect}>Disconnect</Button>
          ) : (
            <Button variant="default" size="sm" onClick={handleConnect}>Connect</Button>
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
                {isConnected ? (
                  <Button variant="destructive" onClick={handleDisconnect}>Disconnect</Button>
                ) : (
                  <Button onClick={handleConnect}>Connect</Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Connection Status</div>
                    <div className="text-lg font-semibold flex items-center mt-1">
                      {hasRecentData ? (
                        <>
                          <Wifi className="h-4 w-4 mr-1 text-green-500" />
                          <span className="text-green-500">ONLINE</span>
                        </>
                      ) : isConnected ? (
                        <>
                          <Wifi className="h-4 w-4 mr-1 text-yellow-500" />
                          <span className="text-yellow-500">CONNECTED</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-4 w-4 mr-1 text-red-500" />
                          <span className="text-red-500">OFFLINE</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {connectionStatus === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-md flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Connection Error</p>
                    <p className="text-sm opacity-90">Error establishing WebSocket connection</p>
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
