
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WebSocketStatus from './WebSocketStatus';
import DynamicPriceChart from './DynamicPriceChart';
import { useWebSocket } from '@/hooks/useWebSocket';
import EpochManager from './EpochManager';

const ImprovedCharts: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState('R_10');
  const [selectedTimeframe, setSelectedTimeframe] = useState('5');
  const { isConnected, connectionStatus, latestTick } = useWebSocket();
  
  // Update WebSocket subscription when market changes
  const handleMarketChange = (market: string) => {
    setSelectedMarket(market);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Market Charts</h2>
          <p className="text-sm text-muted-foreground">Live market data visualization</p>
        </div>
        <WebSocketStatus />
      </div>
      
      <div className="flex flex-wrap gap-4 mb-4">
        <Select 
          value={selectedMarket} 
          onValueChange={handleMarketChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Market" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="R_10">Volatility 10 Index</SelectItem>
            <SelectItem value="R_25">Volatility 25 Index</SelectItem>
            <SelectItem value="R_50">Volatility 50 Index</SelectItem>
            <SelectItem value="R_75">Volatility 75 Index</SelectItem>
            <SelectItem value="R_100">Volatility 100 Index</SelectItem>
          </SelectContent>
        </Select>
        
        <Select 
          value={selectedTimeframe} 
          onValueChange={setSelectedTimeframe}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 min</SelectItem>
            <SelectItem value="5">5 min</SelectItem>
            <SelectItem value="15">15 min</SelectItem>
            <SelectItem value="30">30 min</SelectItem>
            <SelectItem value="60">1 hour</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="price">
            <TabsList className="mb-4">
              <TabsTrigger value="price">Price Chart</TabsTrigger>
              <TabsTrigger value="analysis">Technical Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="price" className="mt-0">
              <DynamicPriceChart 
                timeframes={[1, 5, 15, 30, 60]}
                defaultTimeframe={parseInt(selectedTimeframe)}
                height={400}
                showControls={true}
                showTimeframeSelector={false}
              />
            </TabsContent>
            
            <TabsContent value="analysis" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Technical Analysis</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px] flex flex-col justify-center items-center">
                  <p className="text-muted-foreground">
                    Technical analysis charts with indicators are coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          <EpochManager />
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Market Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Current Price</div>
                  <div className="text-xl font-semibold">
                    {latestTick ? latestTick.value.toFixed(5) : '-'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Market</div>
                  <div className="text-xl font-semibold">
                    {selectedMarket}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Connection</div>
                  <div className="text-base font-medium">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="text-base font-medium capitalize">
                    {connectionStatus}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="text-xs text-muted-foreground mb-2">Real-time Updates</div>
                <p className="text-xs">
                  Price data is updated in real-time via WebSocket connection.
                  Chart visualization uses dynamic coloring to highlight price movements.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImprovedCharts;
