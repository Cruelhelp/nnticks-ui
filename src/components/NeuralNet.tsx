
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import NeuralNetHistory from './NeuralNetHistory';
import { Brain, GitBranch, Settings } from 'lucide-react';

const NeuralNet = () => {
  const [activeTab, setActiveTab] = useState('history');
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Neural Network Management</h1>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <GitBranch className="h-4 w-4 mr-2" />
            Save Model
          </Button>
          <Button size="sm">
            <Brain className="h-4 w-4 mr-2" />
            Train Model
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="history" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="history">Model History</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Advanced Settings
          </Button>
        </div>
        
        <TabsContent value="history">
          <NeuralNetHistory />
        </TabsContent>
        
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Neural Network Configuration</CardTitle>
              <CardDescription>
                Configure your neural network model parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p>Configuration content will go here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NeuralNet;
