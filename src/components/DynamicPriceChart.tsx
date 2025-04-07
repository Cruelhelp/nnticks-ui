import React from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';

interface ChartProps {
  data: any[];
  type?: 'line' | 'area';
  height?: number;
  className?: string;
}

const DynamicPriceChart: React.FC<ChartProps> = ({ 
  data, 
  type = 'line',
  height = 400, // Increased default height
  className 
}) => {
  const ChartComponent = type === 'line' ? LineChart : AreaChart;
  const DataComponent = type === 'line' ? Line : Area;

  return (
    <Card className={cn("p-4", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} className="w-full h-full" style={{ backgroundColor: 'transparent', borderRadius: '8px', padding: '12px' }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="time" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))'
            }}
          />
          <DataComponent
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            fill="url(#colorPrice)"
            strokeWidth={2}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </Card>
  );
};

export default DynamicPriceChart;