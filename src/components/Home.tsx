import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "./Logo";
import { useState } from "react";
import { 
  Dumbbell, 
  LineChart, 
  FileText, 
  Network, 
  BrainCircuit, 
  TrendingUp, 
  Workflow, 
  Zap,
  Lightbulb,
  Link,
  Binary,
  Laptop,
  Smartphone,
  PlugZap,
  Settings2,
  Clock,
  Database
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import EpochCollectionManager from "./EpochCollectionManager";
import { useTraining } from "@/hooks/useTraining";
import { Progress } from "@/components/ui/progress";

interface HomeProps {
  onSectionChange: (section: string) => void;
}

const Home = ({ onSectionChange }: HomeProps) => {
  const { user, userDetails } = useAuth();
  const [activeTab, setActiveTab] = useState("welcome");
  const { availableEpochs, totalEpochs, level } = useTraining();

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <Card className="flex-1">
        <CardHeader className="text-center border-b pb-6 mb-6">
          <div className="flex justify-center mb-4">
            <Logo size={48} />
          </div>
          <CardTitle className="text-3xl">Welcome to NNticks</CardTitle>
          <p className="text-muted-foreground">
            Neural Network-Powered Market Prediction
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 max-w-3xl mx-auto">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card p-3 rounded-md border">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-sm font-medium flex items-center">
                        <Clock className="h-4 w-4 mr-1.5 text-primary" /> 
                        Epoch Status
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => onSectionChange('epochs')}
                      >
                        <TrendingUp className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="text-2xl font-bold">{availableEpochs.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Available epochs</div>
                  </div>
                  
                  <div className="bg-card p-3 rounded-md border">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-sm font-medium flex items-center">
                        <Database className="h-4 w-4 mr-1.5 text-primary" /> 
                        Collection
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => onSectionChange('charts')}
                      >
                        <TrendingUp className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="text-2xl font-bold">{totalEpochs.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total epochs collected</div>
                  </div>
                  
                  <div className="bg-card p-3 rounded-md border">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-sm font-medium flex items-center">
                        <BrainCircuit className="h-4 w-4 mr-1.5 text-primary" /> 
                        Neural Net
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => onSectionChange('neuralnet')}
                      >
                        <TrendingUp className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="text-2xl font-bold">Level {level}</div>
                    <Progress value={level * 20} className="h-1.5 mt-1" />
                  </div>
                </div>
                
                <div className="mt-4">
                  <EpochCollectionManager compact showControls showSettings={true} />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs 
            defaultValue="welcome" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="mx-auto max-w-3xl"
          >
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="welcome">Welcome</TabsTrigger>
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
              <TabsTrigger value="trading">Trading</TabsTrigger>
            </TabsList>
            
            <TabsContent value="welcome" className="space-y-4 animate-fade-in">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">
                  Predict Financial Markets with Neural Networks
                </h3>
                <p className="text-muted-foreground">
                  NNticks combines real-time market data with powerful neural networks
                  to predict market movements and help you make better trading decisions.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <Card className="overflow-hidden border border-primary/20 transition-all duration-300 hover:border-primary/50 hover:shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <BrainCircuit className="h-8 w-8 text-primary" />
                        </div>
                        <h4 className="font-medium">Neural Analysis</h4>
                        <p className="text-sm text-muted-foreground">
                          Predict market movements with advanced machine learning models
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="overflow-hidden border border-primary/20 transition-all duration-300 hover:border-primary/50 hover:shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <LineChart className="h-8 w-8 text-primary" />
                        </div>
                        <h4 className="font-medium">Real-Time Charts</h4>
                        <p className="text-sm text-muted-foreground">
                          Visualize live market data with interactive charts
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="overflow-hidden border border-primary/20 transition-all duration-300 hover:border-primary/50 hover:shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <Dumbbell className="h-8 w-8 text-primary" />
                        </div>
                        <h4 className="font-medium">Training Missions</h4>
                        <p className="text-sm text-muted-foreground">
                          Complete missions to improve your prediction skills
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-8">
                  <Button 
                    size="lg" 
                    onClick={() => setActiveTab("setup")}
                    className="bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/80"
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="setup" className="space-y-4 animate-fade-in">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center flex justify-center items-center gap-2">
                  <PlugZap className="h-6 w-6 text-primary" />
                  Setting Up Your Broker Connection
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <Card className="border border-primary/20 hover:border-primary/40 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Link className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">1. Select a Broker</h4>
                          <p className="text-sm text-muted-foreground">
                            Choose from popular brokers like Deriv, IQ Option, Binance, or MetaTrader.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md overflow-hidden border border-border mt-4">
                        <div className="bg-card/50 p-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-primary/5 rounded p-3 flex items-center justify-center border border-primary/20">
                              <Binary className="h-6 w-6 mr-2 text-primary/70" />
                              <span>Deriv</span>
                            </div>
                            <div className="bg-muted rounded p-3 flex items-center justify-center">
                              <PieChart className="h-6 w-6 mr-2 text-muted-foreground" />
                              <span className="text-muted-foreground">IQ Option</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-primary/20 hover:border-primary/40 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Zap className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">2. Enter Your API Key</h4>
                          <p className="text-sm text-muted-foreground">
                            Provide your broker API key for authentication.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md overflow-hidden border border-border mt-4 p-3">
                        <div className="bg-card/50 rounded flex items-center">
                          <div className="border border-border rounded-l px-3 py-2 bg-muted text-muted-foreground font-mono text-xs">
                            API KEY
                          </div>
                          <div className="border-t border-b border-r border-border rounded-r px-3 py-2 flex-1 bg-card">
                            <div className="bg-primary/10 h-2 rounded animate-pulse w-2/3"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="md:col-span-2 border border-primary/20 hover:border-primary/40 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Settings2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">3. Configure WebSocket Connection</h4>
                          <p className="text-sm text-muted-foreground">
                            Set up WebSocket URL and JSON subscription format for real-time data.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md overflow-hidden border border-border mt-4">
                        <div className="bg-card/50 p-3">
                          <div className="font-mono text-xs mb-3 p-2 bg-muted rounded text-muted-foreground">
                            WebSocket URL: <span className="text-primary">wss://ws.binaryws.com/websockets/v3?app_id=1089</span>
                          </div>
                          <div className="font-mono text-xs p-2 bg-muted rounded text-muted-foreground">
                            Subscription: <span className="text-primary">{"{'ticks':'R_10'}"}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex justify-center gap-4 mt-8">
                  <Button variant="outline" onClick={() => setActiveTab("welcome")}>
                    Back
                  </Button>
                  <Button onClick={() => setActiveTab("training")}>
                    Next: Training
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="training" className="space-y-4 animate-fade-in">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center flex justify-center items-center gap-2">
                  <Workflow className="h-6 w-6 text-primary" />
                  Training Your Neural Network
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <Card className="border border-primary/20 hover:border-primary/40 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">1. Historical Data Analysis</h4>
                          <p className="text-sm text-muted-foreground">
                            The system analyzes historical market data to identify patterns.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md overflow-hidden border border-border mt-4 bg-card/50 p-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-muted-foreground">Processing data</div>
                          <div className="text-xs text-muted-foreground">75%</div>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full">
                          <div className="h-full bg-primary rounded-full w-3/4"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-primary/20 hover:border-primary/40 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Dumbbell className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">2. Complete Training Missions</h4>
                          <p className="text-sm text-muted-foreground">
                            Progress through training missions to improve accuracy.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md overflow-hidden border border-border mt-4 bg-card/50 p-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-primary/20 rounded-md p-2 text-center text-xs">
                            <span className="block font-semibold">Mission 1</span>
                            <span className="text-primary text-xs">Completed</span>
                          </div>
                          <div className="bg-muted rounded-md p-2 text-center text-xs">
                            <span className="block font-semibold">Mission 2</span>
                            <span className="text-muted-foreground text-xs">In Progress</span>
                          </div>
                          <div className="bg-muted/50 rounded-md p-2 text-center text-xs">
                            <span className="block font-semibold">Mission 3</span>
                            <span className="text-muted-foreground text-xs">Locked</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="md:col-span-2 border border-primary/20 hover:border-primary/40 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Network className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">3. Neural Network Training</h4>
                          <p className="text-sm text-muted-foreground">
                            Watch your bot's level increase and track accuracy improvements over time.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md overflow-hidden border border-border mt-4 bg-card/50 p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm font-medium">Network Level: 3</div>
                          <div className="text-sm text-primary">Accuracy: 72%</div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div 
                              key={i} 
                              className={`h-6 rounded ${i <= 5 ? 'bg-primary/60' : 'bg-muted'}`}
                            ></div>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          5/8 connections optimized
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex justify-center gap-4 mt-8">
                  <Button variant="outline" onClick={() => setActiveTab("setup")}>
                    Back
                  </Button>
                  <Button onClick={() => setActiveTab("trading")}>
                    Next: Trading
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="trading" className="space-y-4 animate-fade-in">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center flex justify-center items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Execute Trades with Confidence
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <Card className="border border-primary/20 hover:border-primary/40 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Lightbulb className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">1. Generate Predictions</h4>
                          <p className="text-sm text-muted-foreground">
                            Request predictions based on current market conditions.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md overflow-hidden border border-border mt-4 bg-card/50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium">Prediction</div>
                          <div className="py-1 px-2 rounded bg-green-500/20 text-green-500 text-xs font-semibold">Rise</div>
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">Confidence: 78%</div>
                        <div className="text-sm text-muted-foreground mb-1">Timeframe: 3 ticks</div>
                        <div className="text-sm text-muted-foreground">Market: R_10</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-primary/20 hover:border-primary/40 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <BarChart3 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">2. Watch for Alerts</h4>
                          <p className="text-sm text-muted-foreground">
                            Receive countdowns before prediction periods begin.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md overflow-hidden border border-border mt-4 bg-card/50 p-4">
                        <div className="flex flex-col items-center">
                          <div className="h-16 w-16 rounded-full border-4 border-primary flex items-center justify-center mb-2">
                            <span className="text-xl font-bold">7s</span>
                          </div>
                          <div className="text-sm font-medium">Prediction Starting</div>
                          <div className="text-xs text-muted-foreground">Prepare for entry</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="md:col-span-2 border border-primary/20 hover:border-primary/40 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">3. Track Performance</h4>
                          <p className="text-sm text-muted-foreground">
                            Review your trade history to see successful predictions.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md overflow-hidden border border-border mt-4">
                        <div className="bg-card/50 p-2">
                          <div className="grid grid-cols-5 gap-1 text-xs font-medium border-b pb-2 mb-2">
                            <div>Time</div>
                            <div>Market</div>
                            <div>Direction</div>
                            <div>Confidence</div>
                            <div>Result</div>
                          </div>
                          <div className="grid grid-cols-5 gap-1 text-xs mb-2">
                            <div className="text-muted-foreground">10:23:45</div>
                            <div>R_10</div>
                            <div>Rise</div>
                            <div>75%</div>
                            <div className="text-green-500">Won</div>
                          </div>
                          <div className="grid grid-cols-5 gap-1 text-xs mb-2">
                            <div className="text-muted-foreground">10:21:30</div>
                            <div>R_25</div>
                            <div>Fall</div>
                            <div>62%</div>
                            <div className="text-red-500">Lost</div>
                          </div>
                          <div className="grid grid-cols-5 gap-1 text-xs">
                            <div className="text-muted-foreground">10:18:15</div>
                            <div>R_10</div>
                            <div>Rise</div>
                            <div>84%</div>
                            <div className="text-green-500">Won</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Daily Performance: </span>
                          <span className="font-semibold text-green-500">+12.5%</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Win Rate: </span>
                          <span className="font-semibold">67%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="text-center mt-8">
                  <Button 
                    size="lg" 
                    onClick={() => onSectionChange('charts')}
                    className="bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/80"
                  >
                    <LineChart className="w-5 h-5 mr-2" />
                    Start Trading
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <footer className="text-center text-xs text-muted-foreground mt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-center gap-1 md:gap-2">
          <div className="flex items-center justify-center gap-2">
            <Laptop className="h-3 w-3" />
            <span>Desktop</span>
          </div>
          <span className="hidden md:inline">•</span>
          <div className="flex items-center justify-center gap-2">
            <Smartphone className="h-3 w-3" />
            <span>Mobile</span>
          </div>
          <span className="hidden md:inline">•</span>
          <span>Copyright © 2025 Ruel McNeil</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
