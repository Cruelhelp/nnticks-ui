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
  ResponsiveContainer 
} from 'recharts';
import { Badge } from '@/components/ui/badge';

import React, { useState, useEffect } from 'react';
import { useTheme } from "@/components/ui/theme-provider"

interface ChartProps {
  data: any[];
}

const LineChartView: React.FC<ChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
};

const AreaChartView: React.FC<ChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const BarChartView: React.FC<ChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const Charts: React.FC = () => {
  const [tickData, setTickData] = useState([]);
  const { theme } = useTheme();

  useEffect(() => {
    const generateRandomData = () => {
      const now = Date.now();
      const newData = Array.from({ length: 20 }, (_, i) => ({
        timestamp: new Date(now - i * 60000).toLocaleTimeString(),
        price: 100 + Math.random() * 10,
      }));
      setTickData(newData);
    };

    generateRandomData();
    const intervalId = setInterval(generateRandomData, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const renderCandlestickData = (data) => {
    // Convert candlestick data to a format that works with BarChart or LineChart
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="price" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Market Charts</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card text-card-foreground rounded-md shadow-sm p-4">
          <h3 className="font-semibold mb-2 flex items-center">
            Price Feed <Badge className="ml-2">Realtime</Badge>
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <LineChartView data={tickData} />
          </div>
          {tickData.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: {tickData[0].timestamp}
            </p>
          )}
        </div>

        <div className="bg-card text-card-foreground rounded-md shadow-sm p-4">
          <h3 className="font-semibold mb-2 flex items-center">
            Volume Chart <Badge className="ml-2">Simulated</Badge>
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <BarChartView data={tickData} />
          </div>
          {tickData.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Current Volume:{' '}
              {tickData[0].price.toFixed(2)}
            </p>
          )}
        </div>

        <div className="bg-card text-card-foreground rounded-md shadow-sm p-4">
          <h3 className="font-semibold mb-2 flex items-center">
            Volatility Index <Badge className="ml-2">Synthetic</Badge>
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <AreaChartView data={tickData} />
          </div>
          {tickData.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Volatility Score: {tickData[0].price.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Charts;
