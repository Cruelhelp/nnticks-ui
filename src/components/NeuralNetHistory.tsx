
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Brain, ArrowUpDown, Download, Upload, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { neuralNetwork, NetworkModel } from '@/lib/neuralNetwork';
import { supabase } from '@/lib/supabase';

const NeuralNetHistory = () => {
  const [models, setModels] = useState<NetworkModel[]>([]);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadModels();
  }, [user]);

  const loadModels = async () => {
    setIsLoading(true);
    
    try {
      // Load models from Supabase if user is logged in
      if (user) {
        const { data, error } = await supabase
          .from('models')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Transform data to match NetworkModel structure
          const loadedModels = data.map(item => ({
            config: item.config,
            weights: item.weights,
            biases: item.weights, // Biases might be stored within weights in DB
            accuracy: item.accuracy,
            timestamp: item.created_at,
            version: item.name || '1.0.0'
          }));
          
          setModels(loadedModels);
          
          // Set the most recent model as active
          setActiveModel(data[0].id);
        } else {
          // If no models in DB, use the current model in memory
          const currentModel = neuralNetwork.exportModel();
          setModels([currentModel]);
        }
      } else {
        // If not logged in, use the current model in memory
        const currentModel = neuralNetwork.exportModel();
        setModels([currentModel]);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      toast.error('Failed to load models');
      
      // Fallback to current model
      const currentModel = neuralNetwork.exportModel();
      setModels([currentModel]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportModel = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const success = await neuralNetwork.loadModelFromFile(file);
        
        if (success) {
          toast.success('Model imported successfully');
          
          // Add to models list
          const importedModel = neuralNetwork.exportModel();
          setModels(prev => [importedModel, ...prev]);
          
          // Save to Supabase if logged in
          if (user) {
            saveModelToSupabase(importedModel);
          }
        } else {
          toast.error('Failed to import model');
        }
      } catch (error) {
        console.error('Error importing model:', error);
        toast.error('Failed to import model');
      }
    };
    input.click();
  };

  const handleExportModel = (model: NetworkModel) => {
    try {
      const blob = new Blob([JSON.stringify(model, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nnticks-model-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Model exported successfully');
    } catch (error) {
      console.error('Error exporting model:', error);
      toast.error('Failed to export model');
    }
  };

  const handleActivateModel = async (model: NetworkModel) => {
    try {
      // Import the model into the neural network
      const success = neuralNetwork.importModel(model);
      
      if (success) {
        setActiveModel(model.version);
        toast.success(`Model ${model.version} activated`);
      } else {
        toast.error('Failed to activate model');
      }
    } catch (error) {
      console.error('Error activating model:', error);
      toast.error('Failed to activate model');
    }
  };

  const saveModelToSupabase = async (model: NetworkModel) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.from('models').insert({
        user_id: user.id,
        name: model.version,
        description: `Model trained on ${new Date(model.timestamp).toLocaleString()}`,
        config: model.config,
        accuracy: model.accuracy,
        weights: model.weights,
        active: true,
        created_at: model.timestamp,
        updated_at: new Date().toISOString()
      });
      
      if (error) {
        throw error;
      }
      
      // Update other models to inactive
      await supabase
        .from('models')
        .update({ active: false })
        .eq('user_id', user.id)
        .neq('name', model.version);
        
    } catch (error) {
      console.error('Error saving model to Supabase:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Neural Network History</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleImportModel}>
            <Upload className="h-4 w-4 mr-2" />
            Import Model
          </Button>
          <Button variant="outline" size="sm" onClick={loadModels}>
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading models...</p>
        </div>
      ) : models.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <Brain className="h-8 w-8 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No models found</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleImportModel}>
              Import Your First Model
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {models.map((model, index) => (
            <Card key={index} className={`${activeModel === model.version ? 'border-primary' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text-base">
                    <Brain className="h-4 w-4 mr-2" />
                    Model {model.version}
                    {activeModel === model.version && (
                      <Badge className="ml-2" variant="secondary">Active</Badge>
                    )}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleExportModel(model)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleActivateModel(model)}>
                      <GitBranch className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="flex items-center text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(model.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Accuracy:</span>
                    <span className="font-medium">{(model.accuracy * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Layers:</span>
                    <span className="font-medium">{model.config.layers.join(' → ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Learning Rate:</span>
                    <span className="font-medium">{model.config.learningRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Activation:</span>
                    <span className="font-medium">{model.config.activationFunction}</span>
                  </div>
                </div>
                
                {activeModel !== model.version && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => handleActivateModel(model)}
                  >
                    Activate Model
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NeuralNetHistory;
