
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Brain, Calendar, Clock, Download, Upload, GitBranch, History, Award } from 'lucide-react';
import { neuralNetwork, NetworkModel } from '@/lib/neuralNetwork';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ModelVersion {
  id: string;
  version: string;
  accuracy: number;
  layerConfig: string;
  timestamp: Date;
  trainingEpochs: number;
  trainingData: number;
  description?: string;
}

const NeuralNetHistory: React.FC = () => {
  const [modelVersions, setModelVersions] = useState<ModelVersion[]>([]);
  const [currentModel, setCurrentModel] = useState<NetworkModel | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  // Load model history
  useEffect(() => {
    loadModelHistory();
  }, []);
  
  // Get current model info
  useEffect(() => {
    const modelInfo = neuralNetwork.getModelInfo();
    const currentModel: NetworkModel = {
      config: modelInfo.config,
      weights: [],  // Placeholder
      biases: [],   // Placeholder
      accuracy: modelInfo.accuracy,
      timestamp: new Date().toISOString(),
      version: modelInfo.version
    };
    setCurrentModel(currentModel);
  }, []);
  
  const loadModelHistory = async () => {
    setIsLoading(true);
    
    try {
      // Get model history from Supabase
      if (!user) {
        // Use mock data if no user is logged in
        setModelVersions(getMockModelVersions());
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const versions: ModelVersion[] = data.map(model => ({
          id: model.id,
          version: model.config?.version || 'Unknown',
          accuracy: model.accuracy || 0,
          layerConfig: JSON.stringify(model.config?.layers || []),
          timestamp: new Date(model.created_at),
          trainingEpochs: model.config?.epochs || 0,
          trainingData: model.config?.data_points || 0,
          description: model.description
        }));
        
        setModelVersions(versions);
      } else {
        // If no data, use mock data
        setModelVersions(getMockModelVersions());
      }
    } catch (error) {
      console.error("Error loading model history:", error);
      toast.error("Failed to load model history");
      setModelVersions(getMockModelVersions());
    }
    
    setIsLoading(false);
  };
  
  const getMockModelVersions = (): ModelVersion[] => {
    // Generate mock data for demo purposes
    return [
      {
        id: 'v1',
        version: '1.0.0',
        accuracy: 0.65,
        layerConfig: '[64, 32, 2]',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        trainingEpochs: 50,
        trainingData: 100,
        description: 'Initial model version'
      },
      {
        id: 'v2',
        version: '1.1.0',
        accuracy: 0.72,
        layerConfig: '[64, 48, 24, 2]',
        timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        trainingEpochs: 100,
        trainingData: 200,
        description: 'Added hidden layer'
      },
      {
        id: 'v3',
        version: '1.2.0',
        accuracy: 0.78,
        layerConfig: '[128, 64, 32, 2]',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        trainingEpochs: 200,
        trainingData: 500,
        description: 'Increased layer sizes'
      },
      {
        id: 'v4',
        version: '1.3.0',
        accuracy: 0.85,
        layerConfig: '[128, 64, 32, 2]',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        trainingEpochs: 500,
        trainingData: 1000,
        description: 'Fine-tuned with more data'
      }
    ];
  };
  
  const handleExportModel = () => {
    try {
      neuralNetwork.saveModelToFile();
      toast.success('Model exported successfully');
    } catch (error) {
      console.error('Error exporting model:', error);
      toast.error('Failed to export model');
    }
  };
  
  const handleImportModel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    neuralNetwork.loadModelFromFile(file)
      .then(success => {
        if (success) {
          toast.success('Model imported successfully');
          // Update current model display
          const modelInfo = neuralNetwork.getModelInfo();
          const importedModel: NetworkModel = {
            config: modelInfo.config,
            weights: [],  // Placeholder
            biases: [],   // Placeholder
            accuracy: modelInfo.accuracy,
            timestamp: new Date().toISOString(),
            version: modelInfo.version
          };
          setCurrentModel(importedModel);
        } else {
          toast.error('Failed to import model');
        }
      })
      .catch(error => {
        console.error('Error importing model:', error);
        toast.error('Invalid model file');
      });
      
    // Clear the input
    e.target.value = '';
  };
  
  const handleModelSelect = (id: string) => {
    setSelectedModelId(id === selectedModelId ? null : id);
  };
  
  const handleLoadModel = () => {
    if (!selectedModelId) {
      toast.error('Please select a model to load');
      return;
    }
    
    const selectedModel = modelVersions.find(model => model.id === selectedModelId);
    if (!selectedModel) return;
    
    // Simulate loading the model
    toast.info(`Loading model ${selectedModel.version}...`);
    
    setTimeout(() => {
      toast.success(`Model ${selectedModel.version} loaded successfully`);
      // Update current model info
      setCurrentModel({
        config: {
          learningRate: 0.01,
          epochs: selectedModel.trainingEpochs,
          layers: JSON.parse(selectedModel.layerConfig),
          activationFunction: 'relu'
        },
        weights: [],  // Placeholder
        biases: [],   // Placeholder
        accuracy: selectedModel.accuracy,
        timestamp: selectedModel.timestamp.toISOString(),
        version: selectedModel.version
      });
    }, 1500);
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Neural Network History</h2>
      
      <Tabs defaultValue="model-history">
        <TabsList className="mb-4">
          <TabsTrigger value="model-history">
            <History className="h-4 w-4 mr-2" /> Model History
          </TabsTrigger>
          <TabsTrigger value="current-model">
            <Brain className="h-4 w-4 mr-2" /> Current Model
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="model-history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  <span>Model Version History</span>
                </div>
                <div>
                  <Button variant="outline" size="sm" onClick={handleLoadModel} disabled={!selectedModelId}>
                    Load Selected
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Track your model's evolution and improvements over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm">Loading model history...</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Version</TableHead>
                        <TableHead>Accuracy</TableHead>
                        <TableHead>Layers</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Epochs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modelVersions.map((model) => (
                        <TableRow 
                          key={model.id} 
                          className={selectedModelId === model.id ? 'bg-muted' : 'cursor-pointer'} 
                          onClick={() => handleModelSelect(model.id)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {selectedModelId === model.id && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                              {model.version}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={model.accuracy * 100} className="w-16 h-2" />
                              <span>{(model.accuracy * 100).toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{model.layerConfig}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {model.timestamp.toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{model.trainingEpochs}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4 text-xs text-muted-foreground">
              <div>
                <Clock className="h-3 w-3 inline mr-1" /> Last updated: {new Date().toLocaleTimeString()}
              </div>
              <div>
                {modelVersions.length} versions available
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="current-model">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5" /> Current Model Details
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportModel}>
                    <Download className="h-4 w-4 mr-2" /> Export
                  </Button>
                  <input 
                    type="file" 
                    id="model-file" 
                    accept=".json" 
                    className="hidden" 
                    onChange={handleImportModel} 
                  />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('model-file')?.click()}>
                    <Upload className="h-4 w-4 mr-2" /> Import
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                View and manage your current neural network model
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentModel ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Model Version</div>
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <Badge>{currentModel.version}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Accuracy</div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-2">
                          <Progress value={currentModel.accuracy * 100} className="w-24 h-2" />
                          <span>{(currentModel.accuracy * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="text-sm font-medium mb-2">Network Architecture</div>
                    <div className="rounded-md bg-muted p-3 font-mono text-sm">
                      <div>Layers: {JSON.stringify(currentModel.config.layers)}</div>
                      <div>Learning Rate: {currentModel.config.learningRate}</div>
                      <div>Activation: {currentModel.config.activationFunction}</div>
                      <div>Epochs: {currentModel.config.epochs}</div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="text-sm font-medium mb-2">Model Stats</div>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>Parameters</TableCell>
                          <TableCell>
                            {currentModel.config.layers.reduce((acc, current, i, arr) => {
                              if (i < arr.length - 1) {
                                return acc + (current * arr[i + 1] + arr[i + 1]);
                              }
                              return acc;
                            }, 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Last Updated</TableCell>
                          <TableCell>{new Date(currentModel.timestamp).toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm">Loading model details...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NeuralNetHistory;
