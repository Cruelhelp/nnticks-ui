import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useWebSocket } from '@/hooks/useWebSocket';
import { TickData } from '@/types/chartTypes';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area } from 'recharts';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 border rounded p-2 shadow-md text-xs">
        <p className="text-muted-foreground mb-1">{label}</p>
        <p className="font-medium">{`Price: ${payload[0].value.toFixed(5)}`}</p>
        {payload[0].payload.change !== undefined && (
          <p className={`text-xs ${payload[0].payload.change > 0 ? 'text-green-400' : payload[0].payload.change < 0 ? 'text-red-400' : 'text-gray-400'}`}>
            Change: {payload[0].payload.change > 0 ? '+' : ''}{payload[0].payload.change.toFixed(5)}
          </p>
        )}
      </div>
    );
  }
  return null;
};

interface DynamicPriceChartProps {
  ticks?: TickData[];
  timeframes?: number[];
  defaultTimeframe?: number;
  height?: number;
  showControls?: boolean;
  showTimeframeSelector?: boolean;
  responsiveHeight?: boolean;
  chartType?: 'line' | 'area' | 'candlestick';
  showArea?: boolean;
  showGridLines?: boolean;
  showDataPoints?: boolean;
  smoothCurve?: boolean;
  darkTheme?: boolean;
  symbol?: string;
  type?: string;
}

const DynamicPriceChart: React.FC<DynamicPriceChartProps> = ({
  ticks: propTicks,
  timeframes = [1, 5, 15, 30, 60],
  defaultTimeframe = 5,
  height = 300,
  showControls = true,
  showTimeframeSelector = true,
  responsiveHeight = false,
  chartType = 'line',
  showArea = false,
  showGridLines = true,
  showDataPoints = false,
  smoothCurve = true,
  darkTheme = true,
  symbol = 'R_10',
  type = 'line',
}) => {
  const { ticks: wsTicks, latestTick, isConnected } = useWebSocket();
  const ticks = propTicks || wsTicks;
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const [localChartType, setLocalChartType] = useState<'line' | 'area'>(chartType as 'line' | 'area');
  const [smoothingFactor, setSmoothingFactor] = useState(2);
  const [autoScale, setAutoScale] = useState(true);
  const [yDomain, setYDomain] = useState<[number, number] | undefined>(undefined);
  
  const previousValueRef = useRef<number | null>(null);
  const accumulatedTicksRef = useRef<TickData[]>([]);
  
  useEffect(() => {
    if (chartType === 'line' || chartType === 'area') {
      setLocalChartType(chartType);
    }
  }, [chartType]);
  
  useEffect(() => {
    if (!latestTick) return;
    
    accumulatedTicksRef.current = [...accumulatedTicksRef.current, latestTick];
    
    const cutoffTime = Date.now() - (timeframe * 60 * 1000);
    accumulatedTicksRef.current = accumulatedTicksRef.current.filter(tick => {
      const tickTime = typeof tick.timestamp === 'string' 
        ? new Date(tick.timestamp).getTime() 
        : Number(tick.timestamp);
      return tickTime > cutoffTime;
    });
    
    const processedData = accumulatedTicksRef.current.map((tick, index) => {
      const prevTick = index > 0 ? accumulatedTicksRef.current[index - 1] : null;
      const change = prevTick ? tick.value - prevTick.value : 0;
      
      const tickTime = typeof tick.timestamp === 'string' 
        ? new Date(tick.timestamp) 
        : new Date(Number(tick.timestamp));
      
      const timeStr = tickTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
      
      return {
        time: timeStr,
        timestamp: tickTime.getTime(),
        value: tick.value,
        rawValue: tick.value,
        change
      };
    });
    
    let smoothedData;
    if (smoothingFactor > 0) {
      smoothedData = processedData.map((point, index) => {
        if (index === 0) return point;
        
        const alpha = smoothingFactor / 10;
        const smoothedValue = alpha * point.rawValue + (1 - alpha) * processedData[index - 1].value;
        
        return {
          ...point,
          value: smoothedValue
        };
      });
    } else {
      smoothedData = processedData;
    }
    
    setChartData(smoothedData);
    
    if (autoScale && smoothedData.length > 0) {
      const values = smoothedData.map(d => d.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      const range = max - min;
      const margin = range * 0.1;
      
      setYDomain([min - margin, max + margin]);
    } else {
      setYDomain(undefined);
    }
    
    previousValueRef.current = latestTick.value;
  }, [latestTick, timeframe, smoothingFactor, autoScale]);
  
  const priceMovement = chartData.length >= 2 
    ? chartData[chartData.length - 1].value - chartData[chartData.length - 2].value 
    : 0;
  
  const isPriceRising = priceMovement > 0;
  const isPriceFalling = priceMovement < 0;
  
  const lineColor = isPriceRising 
    ? '#10b981' 
    : isPriceFalling 
      ? '#ef4444' 
      : '#6366f1';
  
  return (
    <Card className="overflow-hidden shadow-none border-0">
      <CardHeader className="px-4 py-3 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-semibold">
            Price Chart
            {latestTick && (
              <span className={`ml-2 text-base font-normal ${
                isPriceRising ? 'text-green-400' : isPriceFalling ? 'text-red-400' : 'text-gray-400'
              }`}>
                {latestTick.value.toFixed(5)}
                <span className="text-xs ml-1">
                  {priceMovement > 0 && '+'}
                  {priceMovement.toFixed(5)}
                </span>
              </span>
            )}
          </CardTitle>
          
          {showTimeframeSelector && (
            <Select 
              value={timeframe.toString()} 
              onValueChange={(value) => setTimeframe(parseInt(value))}
            >
              <SelectTrigger className="w-24 h-7">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                {timeframes.map(tf => (
                  <SelectItem key={tf} value={tf.toString()}>
                    {tf} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-1 pt-0">
        {showControls && (
          <div className="px-3 my-2 flex flex-wrap gap-4 items-center">
            <Tabs value={localChartType} onValueChange={(v) => setLocalChartType(v as 'line' | 'area')} className="w-auto">
              <TabsList className="h-8">
                <TabsTrigger value="line" className="text-xs px-2 h-6">Line</TabsTrigger>
                <TabsTrigger value="area" className="text-xs px-2 h-6">Area</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Smoothing:</span>
              <Slider
                className="w-20"
                value={[smoothingFactor]}
                min={0}
                max={9}
                step={1}
                onValueChange={(v) => setSmoothingFactor(v[0])}
              />
              <span className="text-xs">{smoothingFactor}</span>
            </div>
          </div>
        )}
        
        <div className={responsiveHeight ? "w-full h-full min-h-[200px]" : `w-full h-[${height}px]`} style={{ height: responsiveHeight ? '100%' : height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10 }} 
                minTickGap={30}
                stroke="rgba(255,255,255,0.3)"
              />
              <YAxis 
                domain={yDomain || ['auto', 'auto']} 
                tick={{ fontSize: 10 }}
                stroke="rgba(255,255,255,0.3)"
                tickFormatter={(value) => value.toFixed(5)}
              />
              <Tooltip content={<CustomTooltip />} />
              
              <ReferenceLine 
                y={latestTick?.value || 0} 
                stroke="rgba(255,255,255,0.2)" 
                strokeDasharray="3 3" 
              />
              
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              
              {localChartType === 'area' ? (
                <Area
                  type="monotone" 
                  dataKey="value" 
                  stroke={lineColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorGradient)"
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              ) : (
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={lineColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DynamicPriceChart;
