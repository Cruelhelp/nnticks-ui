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
  Brush,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceArea
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
import { Maximize2, Download, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ChartProps {
  data: any[];
  height?: number;
}

const LineChartView: React.FC<ChartProps> = ({ data, height = 350 }) => {
  const { theme } = useTheme();
  
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
          domain={['auto', 'auto']} 
          tick={{ fontSize: 12 }}
          stroke={theme === 'dark' ? '#888' : '#333'} 
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: theme === 'dark' ? '#222' : '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            color: theme === 'dark' ? '#eee' : '#333'
          }} 
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
          tick={{ fontSize: 12 }}
          stroke={theme === 'dark' ? '#888' : '#333'} 
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: theme === 'dark' ? '#222' : '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            color: theme === 'dark' ? '#eee' : '#333'
          }} 
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
          tick={{ fontSize: 12 }}
          stroke={theme === 'dark' ? '#888' : '#333'} 
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: theme === 'dark' ? '#222' : '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            color: theme === 'dark' ? '#eee' : '#333'
          }} 
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

const CandlestickChart: React.FC<ChartProps> = ({ data, height = 350 }) => {
  const { theme } = useTheme();
  
  // Filter data for candlestick chart
  const formattedData = data.filter(item => 
    item.open !== undefined && 
    item.close !== undefined && 
    item.high !== undefined && 
    item.low !== undefined
  );

  // If no candlestick data is available, show a message
  if (formattedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No candlestick data available</p>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#eee'} />
        <XAxis 
          dataKey="timestamp"
          tick={{ fontSize: 12 }}
          stroke={theme === 'dark' ? '#888' : '#333'}
        />
        <YAxis 
          domain={['auto', 'auto']}
          tick={{ fontSize: 12 }}
          stroke={theme === 'dark' ? '#888' : '#333'}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: theme === 'dark' ? '#222' : '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            color: theme === 'dark' ? '#eee' : '#333'
          }}
          formatter={(value: any, name: string) => [value, name]}
          labelFormatter={(label) => `Time: ${label}`}
        />
        <Legend />
        
        {/* High-Low lines */}
        {formattedData.map((entry, index) => (
          <Line
            key={`line-${index}`}
            dataKey="value"
            data={[
              { timestamp: entry.timestamp, value: entry.high },
              { timestamp: entry.timestamp, value: entry.low }
            ]}
            stroke={entry.open > entry.close ? '#ff4d4f' : '#52c41a'}
            strokeWidth={1}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        ))}
        
        {/* Open-Close rectangles */}
        {formattedData.map((entry, index) => (
          <ReferenceArea
            key={`area-${index}`}
            x1={index - 0.25}
            x2={index + 0.25}
            y1={Math.min(entry.open, entry.close)}
            y2={Math.max(entry.open, entry.close)}
            fill={entry.open > entry.close ? '#ff4d4f' : '#52c41a'}
            fillOpacity={0.7}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

const ScatterPlotView: React.FC<ChartProps> = ({ data, height = 350 }) => {
  const { theme } = useTheme();
  
  // Process the data to include value changes for plotting
  const processedData = data.map((item, index, arr) => ({
    ...item,
    change: index > 0 ? item.value - arr[index - 1].value : 0,
    size: 20 // Constant size for all points
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#eee'} />
        <XAxis 
          type="number" 
          dataKey="value" 
          name="Value" 
          unit=""
          tick={{ fontSize: 12 }}
          stroke={theme === 'dark' ? '#888' : '#333'} 
        />
        <YAxis 
          type="number" 
          dataKey="change" 
          name="Change" 
          unit=""
          tick={{ fontSize: 12 }}
          stroke={theme === 'dark' ? '#888' : '#333'} 
        />
        <ZAxis type="number" dataKey="size" range={[20, 200]} name="Size" />
        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ 
            backgroundColor: theme === 'dark' ? '#222' : '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            color: theme === 'dark' ? '#eee' : '#333'
          }}
          formatter={(value: any, name: string) => [value, name]}
          labelFormatter={() => 'Data Point'}
        />
        <Legend />
        <Scatter 
          name="Data Points" 
          data={processedData} 
          fill="#8884d8"
          isAnimationActive={true}
          animationDuration={500}
        />
      </ScatterChart>
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
    wsUrl: settings.wsUrl || 'wss://ws.binaryws.com/websockets/v3?app_id=1089',
    subscription: settings.subscription ? JSON.parse(settings.subscription) : { ticks: selectedMarket },
    onMessage: (data) => {
      if (data.tick) {
        const tickItem = {
          timestamp: new Date(data.tick.epoch * 1000).toLocaleTimeString(),
          value: data.tick.quote,
          market: data.tick.symbol,
          // Adding mock candlestick data
          open: data.tick.quote - Math.random() * 0.05,
          close: data.tick.quote,
          high: data.tick.quote + Math.random() * 0.05,
          low: data.tick.quote - Math.random() * 0.1
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
        const newData = Array.from({ length: 30 }, (_, i) => {
          const value = 100 + Math.random() * 10;
          return {
            timestamp: new Date(now - (29-i) * 60000).toLocaleTimeString(),
            value: value,
            price: value,
            market: selectedMarket,
            // Adding mock candlestick data
            open: value - Math.random() * 0.5,
            close: value,
            high: value + Math.random() * 0.3,
            low: value - Math.random() * 0.7
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
      
      toast.success(`Data exported as ${format.toUpperCase()}`);
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
      case 'candlestick':
        return <CandlestickChart data={tickData} height={chartHeight} />;
      case 'scatter':
        return <ScatterPlotView data={tickData} height={chartHeight} />;
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
                    <RefreshCw className="h-4 w-4 mr-1" /> Reconnect
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
                  <TabsTrigger value="candlestick">Candlestick</TabsTrigger>
                  <TabsTrigger value="scatter">Scatter Plot</TabsTrigger>
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
                    <span className="font-medium">{tickData[tickData.length - 1].value.toFixed(2)}</span>
                  </p>
                )}
              </CardContent>
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
                    <span className="font-medium">{tickData[tickData.length - 1].value.toFixed(2)}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Charts;
