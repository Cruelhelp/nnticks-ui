
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PriceChart from '@/components/charts/PriceChart';
import EpochManager from '@/components/EpochManager';
import EpochCollectionStats from '@/components/EpochCollectionStats';
import WebSocketStatus from '@/components/WebSocketStatus';
import { useWebSocket } from '@/hooks/useWebSocket';

const Dashboard: React.FC = () => {
  const { isConnected } = useWebSocket({ autoConnect: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Trading Dashboard</h1>
          <p className="text-muted-foreground">Neural network trading prediction system</p>
        </div>
        <WebSocketStatus />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <PriceChart 
            height={350} 
            showControls={true} 
            responsiveHeight={false}
            chartType="area"
          />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Neural Network Training</CardTitle>
            <CardDescription>Collect ticks and train model</CardDescription>
          </CardHeader>
          <CardContent>
            <EpochCollectionStats />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="charts" className="w-full">
        <TabsList>
          <TabsTrigger value="charts">Price Charts</TabsTrigger>
          <TabsTrigger value="epochs">Epochs</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts" className="pt-4">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <PriceChart 
              height={250} 
              showControls={false} 
              showTimeframeSelector={true}
              chartType="line"
              symbol="R_25"
            />
            <PriceChart 
              height={250} 
              showControls={false} 
              showTimeframeSelector={true}
              chartType="line"
              symbol="R_50"
            />
            <PriceChart 
              height={250} 
              showControls={false} 
              showTimeframeSelector={true}
              chartType="line"
              symbol="R_75"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="epochs" className="pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Epoch Collection</CardTitle>
                <CardDescription>Collection settings and controls</CardDescription>
              </CardHeader>
              <CardContent>
                <EpochManager showControls={true} showSettings={true} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Training Stats</CardTitle>
                <CardDescription>Neural network training progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Training visualization coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="predictions" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trading Predictions</CardTitle>
              <CardDescription>Neural network trading signals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">Prediction interface coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
