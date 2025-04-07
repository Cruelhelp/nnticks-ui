import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useTicks } from '@/hooks/useTicks';
import { LineChart, BarChart, Brain, AreaChart, ChevronDown, ChevronUp, HelpCircle, Info } from 'lucide-react';
import DynamicPriceChart from './DynamicPriceChart';
import EpochCollectionStats from './EpochCollectionStats';
import EpochManager from './EpochManager';
import WebSocketStatus from './WebSocketStatus';
import EpochExplainer from './EpochExplainer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MARKETS = [
  { value: 'R_10', label: 'Volatility 10 Index' },
  { value: 'R_25', label: 'Volatility 25 Index' },
  { value: 'R_50', label: 'Volatility 50 Index' },
  { value: 'R_75', label: 'Volatility 75 Index' },
  { value: 'R_100', label: 'Volatility 100 Index' },
  { value: 'BOOM_500', label: 'Boom 500 Index' },
  { value: 'BOOM_1000', label: 'Boom 1000 Index' },
  { value: 'CRASH_500', label: 'Crash 500 Index' },
  { value: 'CRASH_1000', label: 'Crash 1000 Index' }
];

interface ChartOptions {
  showArea: boolean;
  showGridlines: boolean;
  showPoints: boolean;
  smoothCurve: boolean;
  darkMode: boolean;
}

const ImprovedCharts: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState<string>('R_10');
  const [chartOptions, setChartOptions] = useState<ChartOptions>({
    showArea: true,
    showGridlines: true,
    showPoints: false,
    smoothCurve: true,
    darkMode: true,
  });

  const { ticks, latestTick, isConnected, connectionStatus, tickCount } = useTicks({
    maxTicks: 100,
    storeInSupabase: true,
    market: selectedMarket,
    updateEpochs: true
  });

  const handleMarketChange = (value: string) => {
    setSelectedMarket(value);
  };

  const toggleChartOption = (option: keyof ChartOptions) => {
    setChartOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Market Data Analysis</h2>
          <p className="text-muted-foreground">Monitor real-time market data and neural network training</p>
        </div>

        <div className="flex items-center gap-3">
          <EpochExplainer compact />

          <Select value={selectedMarket} onValueChange={handleMarketChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select market" />
            </SelectTrigger>
            <SelectContent>
              {MARKETS.map(market => (
                <SelectItem key={market.value} value={market.value}>
                  {market.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <WebSocketStatus compact showTickInfo />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>
                Price Chart
                <Badge variant="outline" className="ml-2 font-normal">
                  {MARKETS.find(m => m.value === selectedMarket)?.label || selectedMarket}
                </Badge>
              </CardTitle>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <LineChart className="h-3.5 w-3.5 mr-1.5" />
                      Chart Options
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Chart Display</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toggleChartOption('showArea')}>
                      <div className="flex items-center justify-between w-full">
                        <span>Show Area</span>
                        <Badge variant={chartOptions.showArea ? "default" : "outline"} className="ml-2">
                          {chartOptions.showArea ? "On" : "Off"}
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleChartOption('showGridlines')}>
                      <div className="flex items-center justify-between w-full">
                        <span>Show Gridlines</span>
                        <Badge variant={chartOptions.showGridlines ? "default" : "outline"} className="ml-2">
                          {chartOptions.showGridlines ? "On" : "Off"}
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleChartOption('showPoints')}>
                      <div className="flex items-center justify-between w-full">
                        <span>Show Data Points</span>
                        <Badge variant={chartOptions.showPoints ? "default" : "outline"} className="ml-2">
                          {chartOptions.showPoints ? "On" : "Off"}
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleChartOption('smoothCurve')}>
                      <div className="flex items-center justify-between w-full">
                        <span>Smooth Curve</span>
                        <Badge variant={chartOptions.smoothCurve ? "default" : "outline"} className="ml-2">
                          {chartOptions.smoothCurve ? "On" : "Off"}
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <CardDescription>
              Real-time price chart with the latest market movements
            </CardDescription>
          </CardHeader>

          <Tabs defaultValue="line" className="w-full">
            <div className="px-4 border-b">
              <TabsList className="h-9">
                <TabsTrigger value="line" className="text-xs">
                  <LineChart className="h-3.5 w-3.5 mr-1.5" />
                  Line
                </TabsTrigger>
                <TabsTrigger value="area" className="text-xs">
                  <AreaChart className="h-3.5 w-3.5 mr-1.5" />
                  Area
                </TabsTrigger>
                <TabsTrigger value="bar" className="text-xs">
                  <BarChart className="h-3.5 w-3.5 mr-1.5" />
                  Bar
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="line" className="mt-0">
              <CardContent className="p-0">
                <DynamicPriceChart
                  ticks={ticks}
                  type="line"
                  height={350}
                  showArea={false}
                  showGridLines={chartOptions.showGridlines}
                  showDataPoints={chartOptions.showPoints}
                  smoothCurve={chartOptions.smoothCurve}
                  darkTheme={chartOptions.darkMode}
                  symbol={selectedMarket}
                  showPredictions={true}
                />
              </CardContent>
            </TabsContent>

            <TabsContent value="area" className="mt-0">
              <CardContent className="p-0">
                <DynamicPriceChart
                  ticks={ticks}
                  type="area"
                  height={350}
                  showArea={true}
                  showGridLines={chartOptions.showGridlines}
                  showDataPoints={chartOptions.showPoints}
                  smoothCurve={chartOptions.smoothCurve}
                  darkTheme={chartOptions.darkMode}
                  symbol={selectedMarket}
                />
              </CardContent>
            </TabsContent>

            <TabsContent value="bar" className="mt-0">
              <CardContent className="p-0">
                <DynamicPriceChart
                  ticks={ticks}
                  type="bar"
                  height={350}
                  showArea={false}
                  showGridLines={chartOptions.showGridlines}
                  showDataPoints={true}
                  smoothCurve={false}
                  darkTheme={chartOptions.darkMode}
                  symbol={selectedMarket}
                />
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="space-y-6">
          <EpochManager showControls showSettings={false} compact />

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Data Collection
                </CardTitle>
              </div>
              <CardDescription>
                Neural network training progress and tick collection status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <EpochCollectionStats />

              <div className="bg-muted/30 p-3 rounded-md border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center">
                    <Info className="h-4 w-4 mr-1.5 text-blue-500" />
                    What are Epochs & Ticks?
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" align="center" className="max-w-sm">
                        <p>Epochs and ticks are key concepts in neural network training for market prediction.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    <strong>Ticks</strong> are individual price updates from the market. Each tick represents a single data point of the current price at a specific moment in time.
                  </p>
                  <p>
                    <strong>Epochs</strong> are batches of ticks used to train the neural network. When enough ticks are collected, they form an epoch that's processed to improve the prediction model.
                  </p>
                </div>

                <EpochExplainer 
                  trigger={
                    <Button variant="outline" size="sm" className="w-full">
                      Learn More About Neural Network Training
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImprovedCharts;