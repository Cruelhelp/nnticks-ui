import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Clock, BarChart4, Calendar, Download, ChevronRight, Info } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { trainingService, EpochData } from '@/services/TrainingService';
import { toast } from 'sonner';
import { neuralNetwork } from '@/lib/neuralNetwork';
import EpochCollectionManager from './EpochCollectionManager';

const Epochs: React.FC = () => {
  const { user } = useAuth();
  const [epochs, setEpochs] = useState<EpochData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('history');
  
  const loadEpochs = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const epochsList = await trainingService.getEpochs();
      setEpochs(epochsList);
    } catch (error) {
      console.error('Error loading epochs:', error);
      toast.error('Failed to load epochs');
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    if (user) {
      trainingService.setUserId(user.id);
      loadEpochs();
    }
  }, [user, loadEpochs]);
  
  const handleImportModelClick = (epoch: EpochData) => {
    try {
      if (!epoch.modelState) {
        toast.error('No model state available for this epoch');
        return;
      }
      
      neuralNetwork.importModel(epoch.modelState);
      toast.success('Model imported successfully');
    } catch (error) {
      console.error('Error importing model:', error);
      toast.error('Failed to import model');
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return dateString;
    }
  };
  
  const formatDuration = (milliseconds: number | null) => {
    if (!milliseconds) return 'N/A';
    
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Neural Network Epochs</h2>
        <p className="text-sm text-muted-foreground">View and manage training epochs</p>
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="history">Epoch History</TabsTrigger>
              <TabsTrigger value="guide">Epochs Guide</TabsTrigger>
            </TabsList>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Training Epochs History
                  </CardTitle>
                  <CardDescription>
                    View and manage your neural network training epochs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading epochs...</p>
                    </div>
                  ) : epochs.length === 0 ? (
                    <div className="text-center py-12 border rounded-md bg-muted/10">
                      <Brain className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                      <h3 className="mt-4 text-lg font-medium">No Epochs Available</h3>
                      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                        Start the epoch collection process to begin collecting market data and training your neural network.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActiveTab('guide')}
                      >
                        View Epochs Guide
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Epoch</TableHead>
                            <TableHead>Batch Size</TableHead>
                            <TableHead>Completed At</TableHead>
                            <TableHead>Training Time</TableHead>
                            <TableHead>Accuracy</TableHead>
                            <TableHead>Loss</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {epochs.map((epoch) => (
                            <TableRow key={epoch.id}>
                              <TableCell className="font-medium">
                                #{epoch.epochNumber}
                              </TableCell>
                              <TableCell>{epoch.batchSize}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-xs">{formatDate(epoch.completedAt)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{formatDuration(epoch.trainingTime)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {epoch.accuracy !== null ? (
                                  <Badge variant={epoch.accuracy > 0.7 ? "success" : "default"}>
                                    {(epoch.accuracy * 100).toFixed(1)}%
                                  </Badge>
                                ) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {epoch.loss !== null ? epoch.loss.toFixed(4) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleImportModelClick(epoch)}
                                  disabled={!epoch.modelState}
                                >
                                  <Download className="h-3.5 w-3.5 mr-1" />
                                  Use
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground border-t pt-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <Info className="h-3.5 w-3.5 mr-1.5" />
                    {epochs.length} epochs
                  </div>
                  <Button size="sm" variant="ghost" onClick={loadEpochs}>
                    Refresh
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="guide">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Understanding Epochs
                  </CardTitle>
                  <CardDescription>
                    Learn about epochs and how they improve your neural network
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">What are Ticks and Epochs?</h3>
                    <p className="text-sm">
                      <strong>Ticks</strong> are individual price updates received from the market in real time.
                      Each tick represents a single data point that shows the current price at a specific moment.
                    </p>
                    <p className="text-sm">
                      <strong>Epochs</strong> are batches of ticks collected and used to train the neural network.
                      An epoch is complete when we've collected a specific number of ticks (the batch size).
                      Each completed epoch triggers a training session for the neural network.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">How Epoch Collection Works</h3>
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        <div className="bg-primary/20 rounded-full h-6 w-6 flex items-center justify-center shrink-0">
                          <span className="text-sm font-medium">1</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Tick Collection</h4>
                          <p className="text-xs text-muted-foreground">
                            The app continuously collects ticks from the market via WebSocket connection.
                            This happens in the background, even when you navigate to other sections of the app.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="bg-primary/20 rounded-full h-6 w-6 flex items-center justify-center shrink-0">
                          <span className="text-sm font-medium">2</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Batch Completion</h4>
                          <p className="text-xs text-muted-foreground">
                            When the number of collected ticks reaches the configured batch size,
                            an epoch is considered complete and ready for processing.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="bg-primary/20 rounded-full h-6 w-6 flex items-center justify-center shrink-0">
                          <span className="text-sm font-medium">3</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Neural Network Training</h4>
                          <p className="text-xs text-muted-foreground">
                            The completed epoch is used to train the neural network.
                            This improves the network's ability to recognize patterns in the market data.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="bg-primary/20 rounded-full h-6 w-6 flex items-center justify-center shrink-0">
                          <span className="text-sm font-medium">4</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Data Storage</h4>
                          <p className="text-xs text-muted-foreground">
                            Each completed epoch, including the ticks, training time, accuracy, and neural network model state,
                            is saved to the database for future reference and analysis.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="bg-primary/20 rounded-full h-6 w-6 flex items-center justify-center shrink-0">
                          <span className="text-sm font-medium">5</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Continuous Learning</h4>
                          <p className="text-xs text-muted-foreground">
                            The process repeats automatically, allowing the neural network to continuously
                            learn and improve its predictions based on the latest market data.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">Benefits of Epoch-Based Training</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span><strong>Restart Safety:</strong> Your training progress is saved with each epoch, so you can close the app or refresh the page without losing your progress.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span><strong>Continuous Learning:</strong> The neural network can learn incrementally as new market data becomes available.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span><strong>Customizability:</strong> You can adjust the batch size to control how frequently the model learns from new data.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span><strong>Performance Tracking:</strong> You can monitor the accuracy and loss metrics to see how your model improves over time.</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">How to Use Epochs Effectively</h3>
                    <ol className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="bg-muted rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                          <span className="text-xs">1</span>
                        </div>
                        <span>Start epoch collection using the control panel on the right.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="bg-muted rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                          <span className="text-xs">2</span>
                        </div>
                        <span>Let the system collect ticks and train automatically in the background.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="bg-muted rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                          <span className="text-xs">3</span>
                        </div>
                        <span>Monitor the epoch history to track your model's performance over time.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="bg-muted rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                          <span className="text-xs">4</span>
                        </div>
                        <span>Adjust the batch size if needed based on the frequency of market updates.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="bg-muted rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                          <span className="text-xs">5</span>
                        </div>
                        <span>Use the "Import Model" action to restore a specific model state from a previous epoch.</span>
                      </li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <EpochCollectionManager />
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Performance Metrics</CardTitle>
              <CardDescription>
                Neural network training statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {epochs.length > 0 ? (
                <>
                  <div className="space-y-1">
                    <div className="text-sm">Average Accuracy</div>
                    <div className="text-2xl font-semibold">
                      {(epochs.reduce((sum, epoch) => sum + (epoch.accuracy || 0), 0) / epochs.length * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Based on {epochs.length} epochs
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm">Average Training Time</div>
                    <div className="text-2xl font-semibold">
                      {Math.round(epochs.reduce((sum, epoch) => sum + (epoch.trainingTime || 0), 0) / epochs.length)}ms
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <div className="text-sm mb-2">Recent Accuracy Trend</div>
                    <div className="h-24 flex items-end gap-1">
                      {epochs.slice(0, 10).reverse().map((epoch, index) => (
                        <div 
                          key={epoch.id} 
                          className="flex-1 bg-primary/80 rounded-t"
                          style={{ 
                            height: `${(epoch.accuracy || 0) * 100}%`,
                            opacity: 0.5 + (index / 20)
                          }}
                          title={`Epoch #${epoch.epochNumber}: ${((epoch.accuracy || 0) * 100).toFixed(1)}%`}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart4 className="h-12 w-12 mx-auto opacity-20" />
                  <p className="mt-2 text-sm">
                    No epoch data available
                  </p>
                  <p className="text-xs mt-1">
                    Start the epoch collection process to see metrics
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Epochs;
