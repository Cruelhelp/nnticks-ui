
import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Area } from 'recharts';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import { usePredictions } from '@/hooks/usePredictions';
import { Indicators } from '@/lib/indicators';

interface ChartProps {
  ticks: any[];
  type?: 'line' | 'area' | 'bar';
  height?: number;
  showArea?: boolean;
  showGridLines?: boolean;
  showDataPoints?: boolean;
  smoothCurve?: boolean;
  darkTheme?: boolean;
  symbol?: string;
  showPredictions?: boolean;
  className?: string;
}

const DynamicPriceChart: React.FC<ChartProps> = ({ 
  ticks, 
  type = 'line',
  height = 350,
  showGridLines = true,
  showDataPoints = false,
  smoothCurve = true,
  darkTheme = true,
  symbol,
  showPredictions = false,
  className 
}) => {
  const { pendingPrediction } = usePredictions();

  const chartData = useMemo(() => {
    if (!ticks || !Array.isArray(ticks)) return [{time: Date.now(), price: 0}];
    
    // Get price values for Bollinger Bands calculation
    const prices = ticks.map(tick => tick.value);
    
    return ticks.map((tick, index) => {
      const slice = prices.slice(Math.max(0, index - 19), index + 1);
      const bands = Indicators.calculateBollingerBands(slice);
      
      return {
        time: new Date(tick.timestamp).toLocaleTimeString(),
        price: tick.value,
        upper: bands.upper,
        middle: bands.middle,
        lower: bands.lower
      };
    });
  }, [ticks]);

  const latestPrice = chartData[chartData.length - 1]?.price || 0;

  return (
    <Card className={cn("p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{symbol || 'Market Price'}</h2>
          <p className="text-sm text-muted-foreground">Current: {latestPrice.toFixed(2)}</p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          {showGridLines && <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />}
          
          <XAxis 
            dataKey="time" 
            className="text-xs text-muted-foreground"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          
          <YAxis 
            className="text-xs text-muted-foreground"
            domain={['auto', 'auto']}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />

          {/* Bollinger Bands */}
          <Line
            type="monotone"
            dataKey="upper"
            stroke="hsl(var(--primary))"
            strokeOpacity={0.4}
            strokeDasharray="3 3"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="lower"
            stroke="hsl(var(--primary))"
            strokeOpacity={0.4}
            strokeDasharray="3 3"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="middle"
            stroke="hsl(var(--primary))"
            strokeOpacity={0.3}
            dot={false}
          />

          {/* Price Area */}
          {type === 'area' && (
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              fillOpacity={0.3}
              fill="url(#colorPrice)"
            />
          )}

          {/* Main Price Line */}
          <Line
            type={smoothCurve ? "monotone" : "linear"}
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={showDataPoints}
          />

          {/* Current Price Line */}
          <ReferenceLine
            y={latestPrice}
            stroke="yellow"
            strokeDasharray="3 3"
            label={{
              value: `Current: ${latestPrice.toFixed(2)}`,
              fill: 'yellow',
              fontSize: 12
            }}
          />

          {showPredictions && pendingPrediction && (
            <ReferenceLine 
              y={pendingPrediction.startPrice} 
              stroke="hsl(var(--primary))" 
              strokeDasharray="3 3"
              label={{
                value: `Prediction: ${pendingPrediction.type}`,
                fill: 'hsl(var(--primary))',
                fontSize: 12
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default DynamicPriceChart;
