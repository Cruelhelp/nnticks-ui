
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import WebSocketStatus from './WebSocketStatus';
import DynamicPriceChart from './DynamicPriceChart';
import { useWebSocket } from '@/hooks/useWebSocket';
import EpochManager from './EpochManager';
import { BookOpen, HelpCircle, BarChart3, LineChart, AreaChart, Info, Settings, PieChart } from 'lucide-react';

const ImprovedCharts: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState('R_10');
  const [selectedTimeframe, setSelectedTimeframe] = useState('5');
  const [chartType, setChartType] = useState('line');
  const { isConnected, connectionStatus, latestTick } = useWebSocket();
  
  // Update WebSocket subscription when market changes
  const handleMarketChange = (market: string) => {
    setSelectedMarket(market);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Market Analytics</h2>
          <p className="text-sm text-muted-foreground">Real-time data visualization and epoch collection</p>
        </div>
        
        <div className="flex items-center gap-3">
          <WebSocketStatus />
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Understanding Epochs & Ticks</span>
                <span className="sm:hidden">Help</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Understanding Epochs & Ticks
                </DialogTitle>
                <DialogDescription>
                  Learn about the core concepts behind our neural network trading platform
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 my-2">
                <div className="p-4 bg-muted/40 rounded-lg border">
                  <h4 className="font-semibold flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-primary" />
                    What are Ticks?
                  </h4>
                  <p className="text-sm mt-1">
                    Ticks are individual price updates received in real-time from the market. Each tick represents a single 
                    price point at a specific moment in time. Our platform collects these ticks to analyze market patterns 
                    and train neural networks.
                  </p>
                </div>
                
                <div className="p-4 bg-muted/40 rounded-lg border">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-orange-500" />
                    What are Epochs?
                  </h4>
                  <p className="text-sm mt-1">
                    An epoch is a complete batch of ticks used for a single training iteration of the neural network.
                    The default batch size is 100 ticks per epoch, but you can customize this. Each completed epoch
                    improves the neural network's ability to recognize patterns and make predictions.
                  </p>
                </div>
                
                <div className="p-4 bg-muted/40 rounded-lg border">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4 text-blue-500" />
                    How It Works
                  </h4>
                  <p className="text-sm mt-1">
                    Our platform continuously collects ticks from market data streams. Once enough ticks are collected to form an epoch,
                    the neural network is trained on this batch of data. The more epochs completed, the more accurate the predictions become.
                    You can view and manage your epochs in the Training and Neural Network tabs.
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" className="w-full">
                  <Info className="h-4 w-4 mr-2" />
                  View Advanced Documentation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <CardTitle className="text-lg font-medium">
                  Market Visualization
                </CardTitle>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Select 
                    value={selectedMarket} 
                    onValueChange={handleMarketChange}
                  >
                    <SelectTrigger className="w-[180px] h-8">
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
                    <SelectTrigger className="w-[100px] h-8">
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
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <Tabs defaultValue="line" value={chartType} onValueChange={setChartType} className="w-full">
                <div className="px-4 border-b border-border/40">
                  <TabsList className="h-9 w-fit pb-0 pt-0">
                    <TabsTrigger value="line" className="flex items-center gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      <LineChart className="h-3.5 w-3.5" />
                      <span>Line</span>
                    </TabsTrigger>
                    <TabsTrigger value="area" className="flex items-center gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      <AreaChart className="h-3.5 w-3.5" />
                      <span>Area</span>
                    </TabsTrigger>
                    <TabsTrigger value="candle" className="flex items-center gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span>Candle</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="line" className="mt-0">
                  <DynamicPriceChart 
                    timeframes={[1, 5, 15, 30, 60]}
                    defaultTimeframe={parseInt(selectedTimeframe)}
                    height={380}
                    showControls={true}
                    showTimeframeSelector={false}
                    chartType="line"
                  />
                </TabsContent>
                
                <TabsContent value="area" className="mt-0">
                  <DynamicPriceChart 
                    timeframes={[1, 5, 15, 30, 60]}
                    defaultTimeframe={parseInt(selectedTimeframe)}
                    height={380}
                    showControls={true}
                    showTimeframeSelector={false}
                    chartType="area"
                  />
                </TabsContent>
                
                <TabsContent value="candle" className="mt-0">
                  <Card className="shadow-none border-none">
                    <CardContent className="flex flex-col justify-center items-center h-[380px]">
                      <PieChart className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground text-center max-w-md">
                        Candlestick charts are coming soon. This feature will display OHLC price data for more detailed technical analysis.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
            
            <CardFooter className="border-t border-border/40 py-3 text-xs text-muted-foreground">
              <div className="flex justify-between w-full">
                <span>Data source: Deriv WebSocket API</span>
                <span>Last update: {latestTick ? new Date(Number(latestTick.timestamp)).toLocaleTimeString() : 'Waiting for data...'}</span>
              </div>
            </CardFooter>
          </Card>
          
          <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Market Statistics</CardTitle>
              <CardDescription>
                Key metrics and real-time market information
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Current Price</div>
                  <div className="text-xl font-semibold">
                    {latestTick ? latestTick.value.toFixed(5) : '-'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">24h Change</div>
                  <div className="text-xl font-semibold text-green-500">
                    +0.42%
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Market</div>
                  <div className="text-xl font-semibold">
                    {selectedMarket}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Timeframe</div>
                  <div className="text-xl font-semibold">
                    {selectedTimeframe} min
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <EpochManager showControls showSettings={true} />
          
          <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Connection Status</CardTitle>
              <CardDescription>
                WebSocket connection details
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Connection</span>
                  <span className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-full ${
                    isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Status</span>
                  <span className="text-sm font-medium capitalize">{connectionStatus}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Market</span>
                  <span className="text-sm font-medium">{selectedMarket}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Receiving Data</span>
                  <span className={`text-sm font-medium ${latestTick ? 'text-green-500' : 'text-amber-500'}`}>
                    {latestTick ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-border/40">
                <h4 className="text-sm font-medium mb-2">Latest Tick Information</h4>
                {latestTick ? (
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div>Timestamp:</div>
                    <div>{new Date(Number(latestTick.timestamp)).toLocaleTimeString()}</div>
                    
                    <div>Value:</div>
                    <div>{latestTick.value.toFixed(5)}</div>
                    
                    <div>Symbol:</div>
                    <div>{latestTick.symbol || selectedMarket}</div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Waiting for tick data...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImprovedCharts;
