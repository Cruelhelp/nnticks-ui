
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import NeuralNetworkSimulation from './NeuralNetworkSimulation';
import EpochManager from './EpochManager';
import { useTraining } from '@/hooks/useTraining';
import { Brain, Dumbbell, Award, ArrowRight, Activity } from 'lucide-react';
import { toast } from 'sonner';

const NeuralNetwork: React.FC = () => {
  const [activeTab, setActiveTab] = useState('visualization');
  const {
    missions,
    level,
    activeMission,
    progress,
    isTraining,
    availableEpochs,
    totalEpochs,
    isLoadingEpochs,
    activeNodes,
    startMission,
  } = useTraining();

  const quickTrainMissions = [
    { id: 'quick-1', title: '1 Epoch', epochs: 1, description: 'Quick training with 1 epoch' },
    { id: 'quick-5', title: '5 Epochs', epochs: 5, description: 'Short training with 5 epochs' },
    { id: 'quick-10', title: '10 Epochs', epochs: 10, description: 'Basic training with 10 epochs' },
    { id: 'quick-25', title: '25 Epochs', epochs: 25, description: 'Standard training with 25 epochs' },
    { id: 'quick-50', title: '50 Epochs', epochs: 50, description: 'Extended training with 50 epochs' }
  ];

  const handleQuickTrain = (epochs: number) => {
    if (availableEpochs < epochs) {
      toast.error(`Not enough epochs. You need ${epochs} but have ${availableEpochs}.`);
      return;
    }

    // Find the corresponding mission from the training missions
    const mission = missions.find(m => m.epochs <= epochs) || missions[0];
    if (mission) {
      startMission({...mission, epochs: epochs});
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Neural Network</h2>
        <p className="text-sm text-muted-foreground">Train and visualize your neural network model</p>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="visualization">
            <Brain className="mr-2 h-4 w-4" />
            Visualization
          </TabsTrigger>
          <TabsTrigger value="training">
            <Dumbbell className="mr-2 h-4 w-4" />
            Training
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="visualization" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <NeuralNetworkSimulation activeNodes={activeNodes} />
            </div>
            
            <div>
              <EpochManager />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="training" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-primary" />
                  Quick Training
                </CardTitle>
                <CardDescription>
                  Train your neural network quickly with a specified number of epochs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 justify-center">
                  {quickTrainMissions.map((item) => (
                    <Button
                      key={item.id}
                      variant="outline"
                      className="flex-1 min-w-28 bg-card hover:bg-primary/10 border border-primary/20 h-auto py-3"
                      disabled={isTraining || availableEpochs < item.epochs}
                      onClick={() => handleQuickTrain(item.epochs)}
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-lg">{item.title}</span>
                        <span className="text-xs text-muted-foreground mt-1">~{item.epochs * 2} seconds</span>
                      </div>
                    </Button>
                  ))}
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Available epochs: </span>
                    <span className="font-medium">{availableEpochs.toLocaleString()}</span>
                    <span className="text-muted-foreground"> of </span>
                    <span className="font-medium">{totalEpochs.toLocaleString()}</span>
                  </div>
                  
                  {isTraining && (
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="w-40" />
                      <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Dumbbell className="mr-2 h-5 w-5 text-primary" />
                  Training Missions
                </CardTitle>
                <CardDescription>
                  Complete missions to train your model and earn rewards
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-80 overflow-y-auto pr-1">
                <div className="space-y-3">
                  {missions.slice(0, 5).map((mission) => (
                    <div 
                      key={mission.id}
                      className={`p-3 rounded-md border flex flex-col gap-2 ${mission.completed ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-md flex items-center justify-center ${mission.completed ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {mission.completed ? (
                              <Award size={16} />
                            ) : (
                              <span className="text-xs font-bold">{mission.id}</span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">{mission.title}</h4>
                            <p className="text-xs text-muted-foreground">{mission.description}</p>
                          </div>
                        </div>
                        <Badge variant={mission.completed ? "secondary" : "outline"} className="ml-2">
                          {mission.completed ? "Completed" : `${mission.points} pts`}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          {mission.epochs.toLocaleString()} epochs required
                        </div>
                        <Button 
                          size="sm" 
                          variant={mission.completed ? "ghost" : "default"}
                          className="h-7 text-xs"
                          disabled={isTraining || mission.locked || availableEpochs < mission.epochs}
                          onClick={() => startMission(mission)}
                        >
                          {mission.completed ? "Retrain" : "Start"} 
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-primary" />
                  Network Status
                </CardTitle>
                <CardDescription>
                  Current neural network stats and level progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Network Level</span>
                      <Badge className="bg-primary">{level}</Badge>
                    </div>
                    <Progress value={level * 20} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 p-3 rounded-md border">
                      <div className="text-xs text-muted-foreground">Total Epochs</div>
                      <div className="text-lg font-bold mt-1">{totalEpochs.toLocaleString()}</div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md border">
                      <div className="text-xs text-muted-foreground">Available</div>
                      <div className="text-lg font-bold mt-1">{availableEpochs.toLocaleString()}</div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md border">
                      <div className="text-xs text-muted-foreground">Completed Missions</div>
                      <div className="text-lg font-bold mt-1">{missions.filter(m => m.completed).length}</div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md border">
                      <div className="text-xs text-muted-foreground">Available Missions</div>
                      <div className="text-lg font-bold mt-1">{missions.filter(m => !m.locked).length}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NeuralNetwork;
