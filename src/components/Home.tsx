
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "./Logo";
import { useState } from "react";
import { Dumbbell, LineChart, FileText, Network } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface HomeProps {
  onSectionChange: (section: string) => void;
}

const Home = ({ onSectionChange }: HomeProps) => {
  const { user, userDetails } = useAuth();
  const [activeTab, setActiveTab] = useState("welcome");

  return (
    <div className="h-full flex flex-col">
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
            
            <TabsContent value="welcome" className="space-y-4">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">
                  Predict Financial Markets with Neural Networks
                </h3>
                <p className="text-muted-foreground">
                  NNticks combines real-time market data with powerful neural networks
                  to predict market movements and help you make better trading decisions.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center gap-2">
                        <Network className="h-8 w-8 text-primary" />
                        <h4 className="font-medium">Neural Analysis</h4>
                        <p className="text-sm text-muted-foreground">
                          Predict market movements with machine learning
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center gap-2">
                        <LineChart className="h-8 w-8 text-primary" />
                        <h4 className="font-medium">Real-Time Charts</h4>
                        <p className="text-sm text-muted-foreground">
                          Visualize live market data with powerful charts
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center gap-2">
                        <Dumbbell className="h-8 w-8 text-primary" />
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
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="setup" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center">
                  Setting Up Your Broker Connection
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="font-medium mb-2">1. Select a Broker</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose from popular brokers like Deriv, IQ Option, Binance, or MetaTrader.
                      Each broker has a pre-configured WebSocket URL for easy connection.
                    </p>
                    <img 
                      src="https://placehold.co/400x200/1E1E1E/CCCCCC?text=Broker+Selection" 
                      alt="Broker Selection" 
                      className="rounded-md border border-border"
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">2. Enter Your API Key</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Provide your broker API key for authentication.
                      This allows NNticks to access market data through your broker account.
                    </p>
                    <img 
                      src="https://placehold.co/400x200/1E1E1E/CCCCCC?text=API+Key+Entry" 
                      alt="API Key Entry"
                      className="rounded-md border border-border" 
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <h4 className="font-medium mb-2">3. Configure JSON Subscription</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose a preset market or customize your JSON subscription.
                      Example for Deriv R_10: {"{'ticks':'R_10'}"}
                    </p>
                    <img 
                      src="https://placehold.co/800x200/1E1E1E/CCCCCC?text=JSON+Subscription+Configuration" 
                      alt="JSON Subscription"
                      className="rounded-md border border-border" 
                    />
                  </div>
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
            
            <TabsContent value="training" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center">
                  Training Your Neural Network
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="font-medium mb-2">1. Upload Historical Data</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload CSV files with historical tick data to train your neural network.
                      More data leads to better predictions!
                    </p>
                    <img 
                      src="https://placehold.co/400x200/1E1E1E/CCCCCC?text=CSV+Upload" 
                      alt="CSV Upload"
                      className="rounded-md border border-border" 
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">2. Complete Training Missions</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Progress through training missions to improve your bot's accuracy
                      and unlock new features.
                    </p>
                    <img 
                      src="https://placehold.co/400x200/1E1E1E/CCCCCC?text=Training+Missions" 
                      alt="Training Missions"
                      className="rounded-md border border-border" 
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <h4 className="font-medium mb-2">3. Monitor Progress</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Watch your bot's level increase and track accuracy improvements over time.
                      Pro users can customize neural network parameters for optimal performance.
                    </p>
                    <img 
                      src="https://placehold.co/800x200/1E1E1E/CCCCCC?text=Progress+Tracking" 
                      alt="Progress Tracking"
                      className="rounded-md border border-border" 
                    />
                  </div>
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
            
            <TabsContent value="trading" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center">
                  Execute Trades with Confidence
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="font-medium mb-2">1. Generate Predictions</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Request predictions from your neural network based on current market conditions.
                      The system will analyze patterns and provide rise/fall or even/odd predictions.
                    </p>
                    <img 
                      src="https://placehold.co/400x200/1E1E1E/CCCCCC?text=Predictions" 
                      alt="Predictions"
                      className="rounded-md border border-border" 
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">2. Watch for Alerts</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      When a prediction is generated, you'll receive a 10-second countdown
                      before the prediction period begins. This gives you time to prepare.
                    </p>
                    <img 
                      src="https://placehold.co/400x200/1E1E1E/CCCCCC?text=Countdown+Timer" 
                      alt="Countdown Timer"
                      className="rounded-md border border-border" 
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <h4 className="font-medium mb-2">3. Track Performance</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Review your trade history to see which predictions were successful.
                      The system learns from each result to improve future predictions.
                    </p>
                    <img 
                      src="https://placehold.co/800x200/1E1E1E/CCCCCC?text=Trade+History" 
                      alt="Trade History"
                      className="rounded-md border border-border" 
                    />
                  </div>
                </div>
                
                <div className="text-center mt-8">
                  <Button size="lg" onClick={() => onSectionChange('charts')}>
                    Start Trading
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <footer className="text-center text-xs text-muted-foreground mt-4">
        <p>Copyright © 2025 Ruel McNeil</p>
        <p className="mt-1">Developed by Lovable.dev</p>
      </footer>
    </div>
  );
};

export default Home;
