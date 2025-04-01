
import React, { useState, useEffect } from 'react';
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
  ReferenceLine
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { useWebSocket, brokerWebSockets } from '@/hooks/useWebSocket';
import { neuralNetwork, Indicators } from '@/lib/neuralNetwork';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ProcessedTickData, TickData, BrokerConfig } from '@/types/chartTypes';

interface ChartProps {
  tickData: ProcessedTickData[];
  market: string;
  showIndicators: boolean;
}

const ChartComponent: React.FC<ChartProps> = ({ tickData, market, showIndicators }) => {
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
    formattedValue: parseFloat(tick.value.toFixed(5))
  }));
  
  // Calculate indicators if enabled
  const chartData = processedData.map((tick, index, array) => {
    const result = { ...tick };
    
    if (showIndicators) {
      // Extract tick values for calculations
      const values = array.map(t => t.value);
      
      // Calculate RSI if enabled
      if (indicators.rsi && index >= 14) {
        const rsiValue = Indicators.calculateRSI(
          values.slice(0, index + 1),
          14
        );
        result.rsi = rsiValue;
      }
      
      // Calculate MA if enabled
      if (indicators.ma && isPro && index >= 20) {
        const maValue = Indicators.calculateMA(
          values.slice(0, index + 1),
          20
        );
        result.ma = maValue;
      }
      
      // Calculate Bollinger Bands if enabled
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
  
  // Determine the visible data window based on zoom level
  const visibleData = zoomLevel === 100 
    ? chartData 
    : chartData.slice(-(Math.floor(chartData.length * zoomLevel / 100)));
  
  // Chart properties based on the latest tick
  const latestValue = visibleData.length > 0 ? visibleData[visibleData.length - 1].value : 0;
  const valueDecimals = latestValue < 0.1 ? 5 : latestValue < 1 ? 4 : latestValue < 10 ? 3 : 2;
  
  // Calculate domain padding for Y-axis
  const values = visibleData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  const padding = range * 0.1; // 10% padding
  
  const yDomain = [minValue - padding, maxValue + padding];
  
  // Calculate RSI domain if needed
  const rsiDomain = [0, 100]; // RSI is always between 0 and 100
  
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
    // For non-Pro users, only allow RSI
    if (!isPro && indicator !== 'rsi') {
      return;
    }
    
    setIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator]
    }));
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
            
            {/* Add a second Y-axis for RSI */}
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
            
            {/* Main price line */}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              dot={false}
              strokeWidth={2}
              animationDuration={300}
              yAxisId="price"
            />
            
            {/* Indicators */}
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
        </ResponsiveContainer>
      </div>
      
      {showIndicators && (
        <div className="mt-4 flex flex-wrap gap-4">
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
              MA {!isPro && '(Pro)'}
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
              Bollinger {!isPro && '(Pro)'}
            </Label>
          </div>
        </div>
      )}
    </div>
  );
};

const Charts = () => {
  const { userDetails } = useAuth();
  const isPro = userDetails?.proStatus || false;
  
  // Default broker settings
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
  
  // WebSocket connection
  const ws = useWebSocket({
    wsUrl: isConnected ? brokerSettings.wsUrl : '',
    subscription: brokerSettings.subscription,
    onMessage: (data) => {
      console.log('WebSocket message:', data);
      
      // Extract tick data from the message
      let tickData = null;
      
      // Handle Deriv/Binary.com format
      if (data.tick) {
        tickData = {
          timestamp: new Date(data.tick.epoch * 1000).toISOString(),
          value: data.tick.quote,
          market: data.tick.symbol,
          time: new Date(data.tick.epoch * 1000).toLocaleTimeString(),
          formattedValue: parseFloat(data.tick.quote.toFixed(5))
        };
        setMarket(data.tick.symbol);
      }
      // Handle other formats...
      
      if (tickData) {
        setTickData(prev => [...prev.slice(-999), tickData as ProcessedTickData]);
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error: ' + error);
    },
    onOpen: () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      toast.success('Connected to broker successfully!');
    },
    onClose: () => {
      console.log('WebSocket closed');
      setIsConnected(false);
      toast.info('Disconnected from broker');
    }
  });
  
  // Connect automatically on component mount
  useEffect(() => {
    // Auto-connect to default broker
    toggleConnection();
  }, []);
  
  // Connect/disconnect WebSocket
  const toggleConnection = () => {
    if (isConnected) {
      ws.disconnect();
      setIsConnected(false);
    } else {
      setIsConnected(true);
    }
  };
  
  // Load historical ticks from Supabase
  const loadHistoricalTicks = async () => {
    try {
      const { data, error } = await supabase
        .from('ticks')
        .select('*')
        .eq('market', market)
        .order('timestamp', { ascending: true })
        .limit(1000);
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const processed = data.map(tick => ({
          ...tick,
          time: new Date(tick.timestamp).toLocaleTimeString(),
          formattedValue: parseFloat(tick.value.toFixed(5))
        }));
        setTickData(processed);
        toast.success(`Loaded ${data.length} historical ticks`);
      }
    } catch (error) {
      console.error('Error loading historical ticks:', error);
      toast.error('Failed to load historical data');
    }
  };
  
  // Subscription format examples
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
  };
  
  const handleSubscriptionChange = (rawJson: string) => {
    try {
      const subscription = JSON.parse(rawJson);
      setBrokerSettings({
        ...brokerSettings,
        subscription
      });
      
      // Extract market from subscription if possible
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
          </TabsList>
          
          <TabsContent value="live" className="h-full">
            {tickData.length > 0 ? (
              <ChartComponent 
                tickData={tickData} 
                market={market} 
                showIndicators={showIndicators}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Clock size={48} className="mb-4" />
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
              <Button onClick={toggleConnection} variant={isConnected ? "destructive" : "default"}>
                {isConnected ? 'Disconnect' : 'Connect'}
              </Button>
              <Button onClick={loadHistoricalTicks} variant="outline">Load Historical Data</Button>
            </div>
            
            <div className={`px-3 py-1 rounded-full text-xs inline-flex items-center gap-1 ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Charts;
