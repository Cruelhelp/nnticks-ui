import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect } from 'react';
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useSettings } from '@/hooks/useSettings';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Maximize2, Download, ZoomIn, ZoomOut, RefreshCw, Copyright } from 'lucide-react';
import { toast } from 'sonner';

interface ChartProps {
  data: any[];
  height?: number;
}

const LineChartView: React.FC<ChartProps> = ({ data, height = 350 }) => {
  const { theme } = useTheme();
  
  // Calculate a dynamic domain for Y axis to make small changes more visible
  const calculateYAxisDomain = () => {
    if (data.length === 0) return ['auto', 'auto'];
    
    const values = data.map(item => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Create a more dynamic range for small changes
    // If the data range is very small, amplify the differences
    const middle = (max + min) / 2;
    const range = max - min;
    
    // Use a dynamic padding based on the data magnitude
    const padding = Math.max(0.02, range * 5);
    
    return [middle - padding, middle + padding];
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#eee'} />
        <XAxis 
          dataKey="timestamp" 
          tick={{ fontSize: 12 }}
          stroke={theme === 'dark' ? '#888' : '#333'} 
        />
        <YAxis 
          domain={calculateYAxisDomain()}
          tick={{ fontSize: 12 }}
          stroke={theme === 'dark' ? '#888' : '#333'} 
          tickCount={8}
          tickFormatter={(value) => value.toFixed(5)}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: theme === 'dark' ? '#222' : '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            color: theme === 'dark' ? '#eee' : '#333'
          }}
          formatter={(value: any) => [value.toFixed(5), 'Price']}
          labelFormatter={(label) => `Time: ${label}`}
        />
        <Legend />
        <ReferenceLine y={data[0]?.value} stroke="#ff7300" strokeDasharray="3 3" />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#8884d8" 
          activeDot={{ r: 8 }} 
          isAnimationActive={true}
          animationDuration={500}
          dot={false}
        />
        <Brush 
          dataKey="timestamp" 
          height={30} 
          stroke={theme === 'dark' ? '#8884d8' : '#8884d8'}
          fill={theme === 'dark' ? '#333' : '#eee'}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const AreaChartView: React.FC<ChartProps> = ({ data, height = 350 }) => {
  const { theme } = useTheme();
  
  // Calculate a dynamic domain for Y axis with enhanced visualization of small changes
  const calculateYAxisDomain = () => {
    if (data.length === 0) return ['auto', 'auto'];
    
    const values = data.map(item => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    const middle = (max + min) / 2;
    const range = max - min;
    const padding = Math.max(0.02, range * 5);
    
    return [middle - padding, middle + padding];
  };
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#eee'} />
        <XAxis 
          dataKey="timestamp" 
          tick={{ fontSize: 12 }}
          stroke={theme === 'dark' ? '#888' : '#333'} 
        />
        <YAxis 
          domain={calculateYAxisDomain()}
          tick={{ fontSize: 12 }}
          stroke={theme === 'dark' ? '#888' : '#333'} 
          tickCount={8}
          tickFormatter={(value) => value.toFixed(5)}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: theme === 'dark' ? '#222' : '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            color: theme === 'dark' ? '#eee' : '#333'
          }}
          formatter={(value: any) => [value.toFixed(5), 'Price']}
          labelFormatter={(label) => `Time: ${label}`}
        />
        <Legend />
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke="#8884d8" 
          fill="url(#colorValue)" 
          isAnimationActive={true}
          animationDuration={500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const BarChartView: React.FC<ChartProps> = ({ data, height = 350 }) => {
  const { theme } = useTheme();
  
  // Calculate a dynamic domain for Y axis with enhanced visualization
  const calculateYAxisDomain = () => {
    if (data.length === 0) return ['auto', 'auto'];
    
    const values = data.map(item => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    const middle = (max + min) / 2;
    const range = max - min;
    const padding = Math.max(0.02, range * 5);
    
    return [middle - padding, middle + padding];
  };
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#eee'} />
        <XAxis 
          dataKey="timestamp" 
          tick={{ fontSize: 12 }}
          stroke={theme === 'dark' ? '#888' : '#333'} 
        />
        <YAxis 
          domain={calculateYAxisDomain()}
          tick={{ fontSize: 12 }}
          stroke={theme === 'dark' ? '#888' : '#333'} 
          tickCount={8}
          tickFormatter={(value) => value.toFixed(5)}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: theme === 'dark' ? '#222' : '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            color: theme === 'dark' ? '#eee' : '#333'
          }}
          formatter={(value: any) => [value.toFixed(5), 'Price']}
          labelFormatter={(label) => `Time: ${label}`}
        />
        <Legend />
        <Bar 
          dataKey="value" 
          fill="#8884d8" 
          isAnimationActive={true}
          animationDuration={500}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

const Charts: React.FC = () => {
  const [tickData, setTickData] = useState<Array<any>>([]);
  const [chartHeight, setChartHeight] = useState(400);
  const [selectedChart, setSelectedChart] = useState("line");
  const [selectedMarket, setSelectedMarket] = useState("R_10");
  const [maximizedChart, setMaximizedChart] = useState<string | null>(null);
  const { theme } = useTheme();
  const { settings } = useSettings();

  // Connect to WebSocket for real-time data
  const ws = useWebSocket({
    wsUrl: settings?.wsUrl || 'wss://ws.binaryws.com/websockets/v3?app_id=1089',
    subscription: settings?.subscription ? JSON.parse(settings.subscription) : { ticks: selectedMarket },
    onMessage: (data) => {
      if (data.tick) {
        const tickItem = {
          timestamp: new Date(data.tick.epoch * 1000).toLocaleTimeString(),
          value: data.tick.quote,
          market: data.tick.symbol,
        };
        
        setTickData(prev => {
          const newData = [...prev, tickItem];
          // Keep only last 100 ticks for performance
          return newData.slice(-100);
        });
      }
    }
  });

  // Generate sample data when no real-time data is available
  useEffect(() => {
    if (tickData.length === 0) {
      const generateRandomData = () => {
        const now = Date.now();
        // Generate data with small variations to simulate real market data
        let baseValue = 6000 + Math.random() * 10;
        
        const newData = Array.from({ length: 30 }, (_, i) => {
          // Create small, realistic variations with more fluctuation
          baseValue += (Math.random() - 0.5) * 0.5;
          return {
            timestamp: new Date(now - (29-i) * 60000).toLocaleTimeString(),
            value: parseFloat(baseValue.toFixed(5)),
            price: parseFloat(baseValue.toFixed(5)),
            market: selectedMarket
          };
        });
        setTickData(newData);
      };
      
      generateRandomData();
    }
  }, [tickData.length, selectedMarket]);

  const changeMarket = (market: string) => {
    setSelectedMarket(market);
    setTickData([]); // Clear existing data
    
    // Update subscription
    ws.send(JSON.stringify({
      forget_all: "ticks"
    }));
    
    setTimeout(() => {
      ws.send(JSON.stringify({
        ticks: market
      }));
      
      toast.success(`Switched to ${market} market`);
    }, 500);
  };

  const handleExportData = (format: 'csv' | 'json') => {
    try {
      let dataStr;
      
      if (format === 'csv') {
        const headers = 'timestamp,value,market\n';
        const csvData = tickData.map(tick => 
          `${tick.timestamp},${tick.value},${tick.market}`
        ).join('\n');
        dataStr = headers + csvData;
      } else {
        dataStr = JSON.stringify(tickData, null, 2);
      }
      
      // Add company logo and copyright information to exports
      dataStr = "NNticks Enterprise Analytics © 2025\n\n" + dataStr;
      
      const blob = new Blob([dataStr], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `market-data-${selectedMarket}-${new Date().toISOString()}.${format}`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Data exported as ${format.toUpperCase()} with company branding`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const renderChart = () => {
    switch (selectedChart) {
      case 'line':
        return <LineChartView data={tickData} height={chartHeight} />;
      case 'area':
        return <AreaChartView data={tickData} height={chartHeight} />;
      case 'bar':
        return <BarChartView data={tickData} height={chartHeight} />;
      default:
        return <LineChartView data={tickData} height={chartHeight} />;
    }
  };

  const availableMarkets = [
    { id: 'R_10', name: 'Volatility 10 Index' },
    { id: 'R_25', name: 'Volatility 25 Index' },
    { id: 'R_50', name: 'Volatility 50 Index' },
    { id: 'R_75', name: 'Volatility 75 Index' },
    { id: 'R_100', name: 'Volatility 100 Index' },
    { id: 'BOOM500', name: 'Boom 500 Index' },
    { id: 'BOOM1000', name: 'Boom 1000 Index' }
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Market Charts</h2>
      
      {maximizedChart ? (
        <div className="fixed inset-0 z-50 bg-background p-4 pt-16">
          <Button 
            className="absolute top-4 right-4" 
            onClick={() => setMaximizedChart(null)}
          >
            Close
          </Button>
          <div className="h-full">
            {maximizedChart === 'Line' ? (
              <LineChartView data={tickData} height={window.innerHeight - 120} />
            ) : maximizedChart === 'Volume' ? (
              <BarChartView data={tickData} height={window.innerHeight - 120} />
            ) : (
              <AreaChartView data={tickData} height={window.innerHeight - 120} />
            )}
          </div>
        </div>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Chart Controls</CardTitle>
                  <Badge variant={ws.isConnected ? "default" : "destructive"}>
                    {ws.isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Select 
                    value={selectedMarket}
                    onValueChange={changeMarket}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Market" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMarkets.map(market => (
                        <SelectItem key={market.id} value={market.id}>
                          {market.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm" onClick={() => ws.connect()}>
                    <RefreshCw className="h-4 w-4 mr-1" /> {ws.isConnected ? "Reconnect" : "Connect"}
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={() => handleExportData('csv')}>
                    <Download className="h-4 w-4 mr-1" /> Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs 
                defaultValue="line" 
                value={selectedChart}
                onValueChange={setSelectedChart}
                className="w-full"
              >
                <TabsList>
                  <TabsTrigger value="line">Line Chart</TabsTrigger>
                  <TabsTrigger value="area">Area Chart</TabsTrigger>
                  <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                </TabsList>
                
                <div className="flex justify-between items-center mt-4 mb-2">
                  <div className="text-sm flex items-center gap-1">
                    <span className="font-medium text-muted-foreground">Chart Height:</span>
                    <span>{chartHeight}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setChartHeight(Math.max(200, chartHeight - 50))}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Slider
                      value={[chartHeight]}
                      min={200}
                      max={800}
                      step={50}
                      className="w-32"
                      onValueChange={(value) => setChartHeight(value[0])}
                    />
                    <Button variant="outline" size="sm" onClick={() => setChartHeight(Math.min(800, chartHeight + 50))}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Tabs>
              
              {renderChart()}
              
              {/* Current price display */}
              {tickData.length > 0 && (
                <div className="flex justify-between items-center mt-2">
                  <div>
                    <span className="text-sm font-medium">Current price:</span>
                    <span className="text-lg ml-2 font-bold">{tickData[tickData.length - 1].value.toFixed(5)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last updated: {tickData[tickData.length - 1].timestamp}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-1">
                <Copyright className="h-3 w-3" /> 
                <span>NNticks Enterprise Analytics 2025</span>
              </div>
              <div>All data exports include company logo and copyright information</div>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <span>Price Feed</span>
                    <Badge className="ml-2">Realtime</Badge>
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setMaximizedChart('Line')}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <LineChartView data={tickData} />
                </div>
                {tickData.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      Last updated: {tickData[tickData.length - 1].timestamp}
                    </p>
                    <p className="text-sm font-medium">
                      Current price: {tickData[tickData.length - 1].value.toFixed(5)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">Waiting for data...</p>
                )}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground pt-2 border-t">
                <Copyright className="h-3 w-3 mr-1" /> NNticks Analytics
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <span>Volume Chart</span>
                    <Badge className="ml-2" variant="outline">
                      {selectedMarket}
                    </Badge>
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setMaximizedChart('Volume')}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <BarChartView data={tickData} />
                </div>
                {tickData.length > 0 && (
                  <p className="text-sm mt-2">
                    <span className="text-muted-foreground">Current Volume:</span>{' '}
                    <span className="font-medium">{tickData[tickData.length - 1].value.toFixed(5)}</span>
                  </p>
                )}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground pt-2 border-t">
                <Copyright className="h-3 w-3 mr-1" /> NNticks Enterprise
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <span>Volatility Index</span>
                    <Badge className="ml-2" variant="secondary">
                      {selectedMarket}
                    </Badge>
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setMaximizedChart('Volatility')}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <AreaChartView data={tickData} />
                </div>
                {tickData.length > 0 && (
                  <p className="text-sm mt-2">
                    <span className="text-muted-foreground">Volatility Score:</span>{' '}
                    <span className="font-medium">{tickData[tickData.length - 1].value.toFixed(5)}</span>
                  </p>
                )}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground pt-2 border-t">
                <Copyright className="h-3 w-3 mr-1" /> NNticks Volatility Analysis
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Charts;
