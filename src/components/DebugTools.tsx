import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useSettings } from '@/hooks/useSettings';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, RefreshCw, Play, Pause, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const DebugTools = () => {
  const { settings } = useSettings();
  const [autoScroll, setAutoScroll] = useState(true);
  const [pauseLogs, setPauseLogs] = useState(false);
  const [logs, setLogs] = useState<Array<{type: string, message: string, timestamp: Date}>>([]);
  const [tickCount, setTickCount] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [filterErrors, setFilterErrors] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Connect to WebSocket
  const ws = useWebSocket({
    wsUrl: settings.wsUrl || 'wss://ws.binaryws.com/websockets/v3?app_id=1089',
    subscription: settings.subscription ? JSON.parse(settings.subscription) : { ticks: 'R_10' },
    onMessage: (data) => {
      if (!pauseLogs) {
        if (data.tick) {
          setTickCount(prev => prev + 1);
          addLog('info', `Tick received for ${data.tick.symbol}: ${data.tick.quote}`);
        } else if (data.error) {
          addLog('error', `API Error: ${JSON.stringify(data.error)}`);
        } else {
          addLog('info', `Received: ${JSON.stringify(data)}`);
        }
      }
    },
    onError: (error) => {
      setConnectionAttempts(prev => prev + 1);
      addLog('error', `WebSocket error: ${error.message || JSON.stringify(error)}`);
    },
    onOpen: () => {
      addLog('success', `Connection established to ${settings.wsUrl}`);
    },
    onClose: () => {
      addLog('warning', 'Connection closed');
    }
  });

  useEffect(() => {
    // Add initial logs
    addLog('system', 'Debug console initialized');
    addLog('info', `WebSocket URL: ${settings.wsUrl || 'default'}`);
    addLog('info', `Subscription: ${settings.subscription || '{"ticks":"R_10"}'}`);
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [logs]);
  
  const addLog = (type: string, message: string) => {
    if (filterErrors && type !== 'error') return;
    
    setLogs(prev => {
      const newLogs = [...prev, {
        type,
        message,
        timestamp: new Date()
      }];
      
      // Keep only last 100 logs for performance
      if (newLogs.length > 100) {
        return newLogs.slice(-100);
      }
      return newLogs;
    });
  };
  
  const scrollToBottom = () => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  const getLogClass = (type: string) => {
    switch(type) {
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'success': return 'text-green-500';
      case 'system': return 'text-purple-500';
      default: return 'text-muted-foreground';
    }
  };
  
  const handleClearLogs = () => {
    setLogs([]);
    addLog('system', 'Logs cleared');
  };
  
  const handleToggleConnection = () => {
    if (ws.isConnected) {
      ws.disconnect();
      addLog('system', 'Connection manually closed');
    } else {
      ws.connect();
      addLog('system', 'Connection attempt initiated');
    }
  };
  
  const handleExportLogs = () => {
    try {
      const logText = logs.map(log => 
        `[${log.timestamp.toISOString()}] [${log.type.toUpperCase()}] ${log.message}`
      ).join('\n');
      
      const blob = new Blob([logText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nnticks-logs-${new Date().toISOString()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Logs exported successfully');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Failed to export logs');
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Debug Tools</h2>
      
      <Tabs defaultValue="console" className="space-y-4">
        <TabsList>
          <TabsTrigger value="console">Console</TabsTrigger>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="console" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Debug Console</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="errors-only" 
                      checked={filterErrors}
                      onCheckedChange={(checked) => setFilterErrors(!!checked)}
                    />
                    <label 
                      htmlFor="errors-only" 
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Errors only
                    </label>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleClearLogs}>Clear</Button>
                  <Button size="sm" variant="outline" onClick={handleExportLogs}>
                    <Download className="h-4 w-4 mr-1" /> Export
                  </Button>
                </div>
              </div>
              <CardDescription>
                Real-time WebSocket and API connection logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-md p-4 font-mono text-sm h-[400px] overflow-auto">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p>No logs available</p>
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`${getLogClass(log.type)} mb-1`}>
                      <span className="text-muted-foreground mr-2">
                        [{log.timestamp.toLocaleTimeString()}]
                      </span>
                      <span className="font-semibold">
                        [{log.type.toUpperCase()}]
                      </span>{' '}
                      {log.message}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="auto-scroll" 
                  checked={autoScroll}
                  onCheckedChange={(checked) => setAutoScroll(!!checked)}
                />
                <label 
                  htmlFor="auto-scroll" 
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Auto-scroll
                </label>
              </div>
              
              <Button
                size="sm"
                variant={pauseLogs ? "default" : "outline"}
                onClick={() => setPauseLogs(!pauseLogs)}
              >
                {pauseLogs ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                {pauseLogs ? 'Resume' : 'Pause'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>
                WebSocket connection details and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`h-3 w-3 rounded-full ${ws.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium">
                    Status: {ws.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <Badge variant={ws.isConnected ? "default" : "destructive"}>
                  {ws.isConnected ? 'Online' : 'Offline'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">WebSocket URL</h4>
                  <p className="text-sm font-mono bg-muted p-2 rounded-sm overflow-hidden overflow-ellipsis">
                    {settings.wsUrl || 'default'}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Subscription</h4>
                  <p className="text-sm font-mono bg-muted p-2 rounded-sm overflow-hidden overflow-ellipsis">
                    {settings.subscription || '{"ticks":"R_10"}'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Connection Attempts</h4>
                  <p className="text-xl font-semibold">{connectionAttempts}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Ticks Received</h4>
                  <p className="text-xl font-semibold">{tickCount}</p>
                </div>
              </div>
              
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-medium text-muted-foreground">Last 5 ticks</h4>
                <div className="bg-muted rounded-md p-2">
                  {ws.ticks.slice(-5).map((tick, i) => (
                    <div key={i} className="text-sm font-mono">
                      <span className="text-muted-foreground">{new Date(tick.timestamp).toLocaleTimeString()}</span>: {tick.value.toFixed(6)}
                    </div>
                  ))}
                  {ws.ticks.length === 0 && (
                    <div className="text-sm text-muted-foreground">No tick data available</div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={handleToggleConnection} className="flex-1">
                {ws.isConnected ? 'Disconnect' : 'Connect'}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => ws.connect()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Reconnect
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Monitor system and network performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Memory Usage</span>
                  <span>64MB</span>
                </div>
                <Progress value={20} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Network Latency</span>
                  <span>53ms</span>
                </div>
                <Progress value={10} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tick Processing Rate</span>
                  <span>{tickCount > 0 ? '1.2 ticks/s' : '0 ticks/s'}</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
              
              <div className="rounded-md border p-3 mt-4">
                <h4 className="text-sm font-medium mb-2">System Information</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Browser:</span>
                    <span>{navigator.userAgent.split(' ').slice(-1)[0].split('/')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Screen:</span>
                    <span>{window.innerWidth}x{window.innerHeight}</span>
                  </div>
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
