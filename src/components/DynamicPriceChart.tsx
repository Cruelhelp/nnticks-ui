
import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import { usePredictions } from '@/hooks/usePredictions';

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
    return ticks.map(tick => ({
      time: new Date(tick.timestamp).toLocaleTimeString(),
      price: tick.value
    }));
  }, [ticks]);

  return (
    <Card className={cn("p-4", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          {showGridLines && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
          <XAxis 
            dataKey="time" 
            className="text-xs"
            interval="preserveStartEnd"
          />
          <YAxis 
            className="text-xs"
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))'
            }}
          />
          <Line
            type={smoothCurve ? "monotone" : "linear"}
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={showDataPoints}
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
