import React, { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
  CandlestickChart,
  Candlestick
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, ZoomIn, ZoomOut, RefreshCw, LineChart as LineChartIcon, AreaChart as AreaChartIcon, CandlestickChart as CandlestickChartIcon } from 'lucide-react';
import { useWebSocket, brokerWebSockets } from '@/hooks/useWebSocket';
import { neuralNetwork, Indicators } from '@/lib/neuralNetwork';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ProcessedTickData, TickData, BrokerConfig } from '@/types/chartTypes';

interface ChartProps {
  tickData: ProcessedTickData[];
  market: string;
  showIndicators: boolean;
  chartType: 'line' | 'area' | 'candlestick';
}

const ChartComponent: React.FC<ChartProps> = ({ tickData, market, showIndicators, chartType }) => {
  const { settings } = useSettings();
  const [zoomLevel, setZoomLevel] = useState(100);
  const [indicators, setIndicators] = useState({
    rsi: true,
    ma: false,
    bollinger: false
  });
  const { userDetails } = useAuth();
  const isPro = userDetails?.proStatus || false;
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  const processedData = tickData.map(tick => ({
    ...tick,
    time: formatTime(tick.timestamp),
    formattedValue: parseFloat(tick.value.toFixed(5)),
    open: tick.open || tick.value,
    high: tick.high || tick.value,
    low: tick.low || tick.value,
    close: tick.close || tick.value
  }));
  
  const chartData = processedData.map((tick, index, array) => {
    const result = { ...tick };
    
    if (showIndicators) {
      const values = array.map(t => t.value);
      
      if (indicators.rsi && index >= 14) {
        const rsiValue = Indicators.calculateRSI(
          values.slice(0, index + 1),
          14
        );
        result.rsi = rsiValue;
      }
      
      if (indicators.ma && isPro && index >= 20) {
        const maValue = Indicators.calculateMA(
          values.slice(0, index + 1),
          20
        );
        result.ma = maValue;
      }
      
      if (indicators.bollinger && isPro && index >= 20) {
        const [middle, upper, lower] = Indicators.calculateBollingerBands(
          values.slice(0, index + 1),
          20,
          2
        );
        result.bollingerMiddle = middle;
        result.bollingerUpper = upper;
        result.bollingerLower = lower;
      }
    }
    
    return result;
  });
  
  const visibleData = zoomLevel === 100 
    ? chartData 
    : chartData.slice(-(Math.floor(chartData.length * zoomLevel / 100)));
  
  const latestValue = visibleData.length > 0 ? visibleData[visibleData.length - 1].value : 0;
  const valueDecimals = latestValue < 0.1 ? 5 : latestValue < 1 ? 4 : latestValue < 10 ? 3 : 2;
  
  const values = visibleData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  const padding = range * 0.1;
  
  const yDomain = [minValue - padding, maxValue + padding];
  
  const rsiDomain = [0, 100];
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.max(10, prev - 10));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.min(100, prev + 10));
  };
  
  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  const toggleIndicator = (indicator: keyof typeof indicators) => {
    if (!isPro && indicator !== 'rsi') {
      toast.error("Upgrade to Pro to access advanced indicators");
      return;
    }
    
    setIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator]
    }));
  };
  
  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart
            data={visibleData}
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
              tickCount={5}
            />
            <YAxis 
              yAxisId="price"
              domain={yDomain}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
              tickFormatter={(value) => value.toFixed(valueDecimals)}
            />
            
            {showIndicators && indicators.rsi && (
              <YAxis 
                yAxisId="rsi"
                domain={rsiDomain}
                orientation="right"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                stroke="#8884d8"
                tickFormatter={(value) => `${value}%`}
              />
            )}
            
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--card-foreground))'
              }} 
            />
            
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              dot={false}
              strokeWidth={2}
              animationDuration={300}
              yAxisId="price"
            />
            
            {showIndicators && indicators.rsi && (
              <Line 
                type="monotone" 
                dataKey="rsi" 
                stroke="#8884d8" 
                dot={false}
                strokeDasharray="5 5"
                yAxisId="rsi"
              />
            )}
            
            {showIndicators && isPro && indicators.ma && (
              <Line 
                type="monotone" 
                dataKey="ma" 
                stroke="#ffc658" 
                dot={false}
                yAxisId="price"
              />
            )}
            
            {showIndicators && isPro && indicators.bollinger && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="bollingerMiddle" 
                  stroke="#82ca9d" 
                  dot={false}
                  strokeDasharray="3 3"
                  yAxisId="price"
                />
                <Line 
                  type="monotone" 
                  dataKey="bollingerUpper" 
                  stroke="#8884d8" 
                  dot={false}
                  strokeDasharray="3 3"
                  yAxisId="price"
                />
                <Line 
                  type="monotone" 
                  dataKey="bollingerLower" 
                  stroke="#8884d8" 
                  dot={false}
                  strokeDasharray="3 3"
                  yAxisId="price"
                />
              </>
            )}
          </LineChart>
        );
      
      case 'area':
        return (
          <AreaChart
            data={visibleData}
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
              tickCount={5}
            />
            <YAxis 
              yAxisId="price"
              domain={yDomain}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
              tickFormatter={(value) => value.toFixed(valueDecimals)}
            />
            
            {showIndicators && indicators.rsi && (
              <YAxis 
                yAxisId="rsi"
                domain={rsiDomain}
                orientation="right"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                stroke="#8884d8"
                tickFormatter={(value) => `${value}%`}
              />
            )}
            
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--card-foreground))'
              }} 
            />
            
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary)/30)"
              yAxisId="price"
            />
            
            {showIndicators && indicators.rsi && (
              <Line 
                type="monotone" 
                dataKey="rsi" 
                stroke="#8884d8" 
                dot={false}
                strokeDasharray="5 5"
                yAxisId="rsi"
              />
            )}
            
            {showIndicators && isPro && indicators.ma && (
              <Line 
                type="monotone" 
                dataKey="ma" 
                stroke="#ffc658" 
                dot={false}
                yAxisId="price"
              />
            )}
          </AreaChart>
        );
      
      case 'candlestick':
        return (
          <CandlestickChart
            data={visibleData}
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
              tickCount={5}
            />
            <YAxis 
              yAxisId="price"
              domain={yDomain}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
              tickFormatter={(value) => value.toFixed(valueDecimals)}
            />
            
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--card-foreground))'
              }} 
              formatter={(value: any) => value.toFixed(valueDecimals)}
            />
            
            <Candlestick
              yAxisId="price"
              nameKey="time"
              fill="#c23f3f" 
              stroke="#c23f3f" 
              wickStroke="#c23f3f" 
              fillOpacity={1}
              xAxisId={0}
            />
          </CandlestickChart>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{market}</h3>
          {latestValue && (
            <span className="text-sm font-mono">{latestValue.toFixed(valueDecimals)}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
            <ZoomIn size={16} />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
            <ZoomOut size={16} />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleResetZoom}>
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          {showIndicators && (
            <>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="rsi" 
                  checked={indicators.rsi} 
                  onCheckedChange={() => toggleIndicator('rsi')}
                />
                <Label htmlFor="rsi">RSI</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="ma" 
                  checked={indicators.ma} 
                  onCheckedChange={() => toggleIndicator('ma')}
                  disabled={!isPro}
                />
                <Label htmlFor="ma">
                  MA {!isPro && <Badge variant="outline" className="ml-1 text-xs">Pro</Badge>}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="bollinger" 
                  checked={indicators.bollinger} 
                  onCheckedChange={() => toggleIndicator('bollinger')}
                  disabled={!isPro}
                />
                <Label htmlFor="bollinger">
                  BB {!isPro && <Badge variant="outline" className="ml-1 text-xs">Pro</Badge>}
                </Label>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Charts = () => {
  const { userDetails, user } = useAuth();
  const isPro = userDetails?.proStatus || false;
  
  const [brokerSettings, setBrokerSettings] = useState<BrokerConfig>({
    broker: 'binary',
    wsUrl: 'wss://ws.binaryws.com/websockets/v3?app_id=1089',
    apiKey: 'bJ29WdfG59AhOEN',
    subscription: { ticks: 'R_10' }
  });
  
  const [showIndicators, setShowIndicators] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [market, setMarket] = useState('R_10');
  const [tickData, setTickData] = useState<ProcessedTickData[]>([]);
  const [chartType, setChartType] = useState<'line' | 'area' | 'candlestick'>('line');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const isConnecting = React.useRef(false);
  
  const ws = useWebSocket({
    wsUrl: isConnected ? brokerSettings.wsUrl : '',
    subscription: brokerSettings.subscription,
    onMessage: (data) => {
      let tickData = null;
      
      if (data.tick) {
        tickData = {
          timestamp: new Date(data.tick.epoch * 1000).toISOString(),
          value: data.tick.quote,
          market: data.tick.symbol,
          time: new Date(data.tick.epoch * 1000).toLocaleTimeString(),
          formattedValue: parseFloat(data.tick.quote.toFixed(5)),
          
          open: data.tick.open || data.tick.quote,
          high: data.tick.high || data.tick.quote,
          low: data.tick.low || data.tick.quote,
          close: data.tick.quote
        };
        setMarket(data.tick.symbol);
      }
      
      if (tickData) {
        setTickData(prev => {
          const newData = [...prev.slice(-99), tickData as ProcessedTickData];
          return newData;
        });
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      if (connectionAttempts < 3) {
        toast.error('Connection error. Attempting to reconnect...');
      } else {
        toast.error('Failed to connect after multiple attempts. Please try again later.');
      }
      setIsConnected(false);
      isConnecting.current = false;
    },
    onOpen: () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      isConnecting.current = false;
      setConnectionAttempts(0);
      toast.success('Connected to broker successfully!', {
        id: 'connection-status',
      });
    },
    onClose: () => {
      console.log('WebSocket closed');
      setIsConnected(false);
      isConnecting.current = false;
    },
    autoReconnect: false
  });
  
  useEffect(() => {
    if (!isConnected && !isConnecting.current) {
      toggleConnection();
    }
    
    if (user) {
      storeSession();
    }
    
    return () => {
      if (isConnected) {
        ws.disconnect();
      }
    };
  }, [user]);
  
  const storeSession = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase.from('user_sessions').insert({
        user_id: user.id,
        start_time: new Date().toISOString(),
        device_info: navigator.userAgent,
        status: 'active'
      });
      
      if (error) {
        console.error('Error storing session:', error);
      }
    } catch (err) {
      console.error('Failed to store session:', err);
    }
  };
  
  const toggleConnection = () => {
    if (isConnected) {
      ws.disconnect();
      setIsConnected(false);
      toast.info('Disconnected from broker', {
        id: 'connection-status',
      });
    } else {
      if (!isConnecting.current) {
        isConnecting.current = true;
        setConnectionAttempts(prev => prev + 1);
        setIsConnected(true);
      }
    }
  };
  
  const loadHistoricalTicks = async () => {
    try {
      const { data, error } = await supabase
        .from('ticks')
        .select('*')
        .eq('market', market)
        .order('timestamp', { ascending: true })
        .limit(100);
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const processed = data.map(tick => ({
          ...tick,
          time: new Date(tick.timestamp).toLocaleTimeString(),
          formattedValue: parseFloat(tick.value.toFixed(5)),
          open: tick.open || tick.value,
          high: tick.high || tick.value,
          low: tick.low || tick.value,
          close: tick.close || tick.value
        }));
        setTickData(processed);
        toast.success(`Loaded ${data.length} historical ticks`);
      } else {
        toast.info('No historical data found for this market');
      }
    } catch (error) {
      console.error('Error loading historical ticks:', error);
      toast.error('Failed to load historical data');
    }
  };
  
  const subscriptionExamples = [
    { label: 'Deriv R_10', value: '{"ticks":"R_10"}' },
    { label: 'IQ Option EURUSD', value: '{"symbol":"EURUSD"}' },
    { label: 'Binance BTCUSDT', value: '{"method":"SUBSCRIBE","params":["btcusdt@ticker"]}' },
    { label: 'MetaTrader EURUSD', value: '{"symbol":"EURUSD"}' },
    { label: 'Binary.com V_75', value: '{"ticks":"V_75"}' }
  ];
  
  const handleBrokerChange = (broker: string) => {
    const wsUrl = brokerWebSockets[broker];
    const subscription = subscriptionExamples.find(
      example => example.label.toLowerCase().startsWith(broker)
    );
    
    setBrokerSettings({
      ...brokerSettings,
      broker,
      wsUrl,
      subscription: subscription ? JSON.parse(subscription.value) : {}
    });
    
    if (isConnected) {
      ws.disconnect();
      setIsConnected(false);
    }
  };
  
  const handleSubscriptionChange = (rawJson: string) => {
    try {
      const subscription = JSON.parse(rawJson);
      setBrokerSettings({
        ...brokerSettings,
        subscription
      });
      
      if (subscription.ticks) {
        setMarket(subscription.ticks);
      } else if (subscription.symbol) {
        setMarket(subscription.symbol);
      } else if (subscription.params && subscription.params[0]) {
        setMarket(subscription.params[0].split('@')[0]);
      }
    } catch (error) {
      console.error('Invalid JSON subscription:', error);
      toast.error('Invalid JSON format');
    }
  };
  
  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Market Chart</span>
          <div className="flex items-center gap-2">
            <Switch 
              id="indicators" 
              checked={showIndicators}
              onCheckedChange={setShowIndicators}
            />
            <Label htmlFor="indicators">Indicators</Label>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-5rem)] flex flex-col">
        <Tabs defaultValue="live" className="mb-4">
          <TabsList>
            <TabsTrigger value="live">Live Data</TabsTrigger>
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="chartType">Chart Type</TabsTrigger>
          </TabsList>
          
          <TabsContent value="live" className="h-full">
            {tickData.length > 0 ? (
              <ChartComponent 
                tickData={tickData} 
                market={market} 
                showIndicators={showIndicators}
                chartType={chartType}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Clock size={48} className="mb-4 animate-pulse" />
                <p>No tick data available</p>
                <p className="text-sm">Connect to a broker or load historical data</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="connection" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="broker">Broker</Label>
                <select 
                  id="broker"
                  className="w-full p-2 bg-background border border-input rounded-md"
                  value={brokerSettings.broker}
                  onChange={(e) => handleBrokerChange(e.target.value)}
                >
                  <option value="deriv">Deriv</option>
                  <option value="iqOption">IQ Option</option>
                  <option value="binance">Binance</option>
                  <option value="metatrader">MetaTrader 4/5</option>
                  <option value="binary">Binary.com</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="wsUrl">WebSocket URL</Label>
                <input 
                  id="wsUrl"
                  type="text"
                  className="w-full p-2 bg-background border border-input rounded-md"
                  value={brokerSettings.wsUrl}
                  onChange={(e) => setBrokerSettings({...brokerSettings, wsUrl: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <input 
                id="apiKey"
                type="password"
                className="w-full p-2 bg-background border border-input rounded-md"
                value={brokerSettings.apiKey}
                onChange={(e) => setBrokerSettings({...brokerSettings, apiKey: e.target.value})}
                placeholder="Enter your API key"
              />
            </div>
            
            <div>
              <Label htmlFor="subscription">Subscription JSON</Label>
              <div className="flex gap-2 mb-2">
                {subscriptionExamples.map((example) => (
                  <Button 
                    key={example.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSubscriptionChange(example.value)}
                  >
                    {example.label}
                  </Button>
                ))}
              </div>
              <textarea 
                id="subscription"
                className="w-full p-2 h-24 bg-background border border-input rounded-md font-mono text-sm"
                value={JSON.stringify(brokerSettings.subscription, null, 2)}
                onChange={(e) => handleSubscriptionChange(e.target.value)}
              />
            </div>
            
            <div className="flex justify-between">
              <Button 
                onClick={toggleConnection} 
                variant={isConnected ? "destructive" : "default"}
                disabled={isConnecting.current}
              >
                {isConnected ? 'Disconnect' : (isConnecting.current ? 'Connecting...' : 'Connect')}
              </Button>
              <Button onClick={loadHistoricalTicks} variant="outline">Load Historical Data</Button>
            </div>
            
            <div className={`px-3 py-1 rounded-full text-xs inline-flex items-center gap-1 ${isConnected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            
            {!isPro && (
              <div className="mt-4 p-4 border border-purple-300 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                <h4 className="font-semibold flex items-center gap-2 text-purple-800 dark:text-purple-300">
                  <span className="text-sm bg-purple-200 dark:bg-purple-800 px-2 py-0.5 rounded">PRO</span>
                  Upgrade for more features
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-400 my-2">
                  Get access to advanced indicators, multiple chart types, and premium market data.
                </p>
                <Button 
                  onClick={() => window.location.href = `https://paypal.me/username?business=support@nnticks.com`}
                  variant="default" 
                  className="mt-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Upgrade to Pro
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="chartType" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card 
                className={`cursor-pointer p-4 ${chartType === 'line' ? 'border-primary bg-primary/10' : ''}`} 
                onClick={() => setChartType('line')}
              >
                <div className="flex flex-col items-center">
                  <LineChartIcon className="h-8 w-8 mb-2" />
                  <span>Line Chart</span>
                </div>
              </Card>
              <Card 
                className={`cursor-pointer p-4 ${chartType === 'area' ? 'border-primary bg-primary/10' : ''}`} 
                onClick={() => setChartType('area')}
              >
                <div className="flex flex-col items-center">
                  <AreaChartIcon className="h-8 w-8 mb-2" />
                  <span>Area Chart</span>
                </div>
              </Card>
              <Card 
                className={`cursor-pointer p-4 ${chartType === 'candlestick' ? 'border-primary bg-primary/10' : ''} ${!isPro ? 'opacity-60' : ''}`} 
                onClick={() => isPro ? setChartType('candlestick') : toast.error("Upgrade to Pro for Candlestick charts")}
              >
                <div className="flex flex-col items-center relative">
                  <CandlestickChartIcon className="h-8 w-8 mb-2" />
                  <span>Candlestick Chart</span>
                  {!isPro && (
                    <Badge variant="secondary" className="absolute -top-2 -right-2">PRO</Badge>
                  )}
                </div>
              </Card>
            </div>
            
            {!isPro && (
              <div className="mt-4 p-4 border border-purple-300 bg-purple-50 dark:bg-purple-900/20 rounded-md animate-pulse">
                <h4 className="font-semibold flex items-center gap-2 text-purple-800 dark:text-purple-300">
                  <span className="text-sm bg-purple-200 dark:bg-purple-800 px-2 py-0.5 rounded">PRO</span>
                  Unlock Premium Charts
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-400 my-2">
                  Get access to Candlestick charts and advanced technical indicators with a Pro subscription.
                </p>
                <Button 
                  onClick={() => window.location.href = `https://paypal.me/username?business=support@nnticks.com`}
                  variant="default" 
                  className="mt-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Upgrade to Pro
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Charts;
