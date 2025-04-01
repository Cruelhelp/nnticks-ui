
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  ArrowDown, 
  ArrowUp, 
  Download, 
  CalendarIcon,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface TradeHistoryItem {
  id: number;
  timestamp: string;
  market: string;
  prediction: string;
  confidence: number;
  outcome: string;
}

interface TrainingHistoryItem {
  id: number;
  date: string;
  mission: string;
  points: number;
  accuracy: number;
}

const History = () => {
  const { user, userDetails } = useAuth();
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isPro = userDetails?.proStatus || false;
  
  // Load history data
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    const loadHistory = async () => {
      setLoading(true);
      try {
        // Load trade history
        const { data: tradeData, error: tradeError } = await supabase
          .from('trade_history')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false });
          
        if (tradeError) throw tradeError;
        
        if (tradeData) {
          setTradeHistory(tradeData);
        }
        
        // Load training history
        const { data: trainingData, error: trainingError } = await supabase
          .from('training_history')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });
          
        if (trainingError) throw trainingError;
        
        if (trainingData) {
          setTrainingHistory(trainingData);
        }
      } catch (error) {
        console.error('Error loading history data:', error);
        toast.error('Failed to load history data');
      } finally {
        setLoading(false);
      }
    };
    
    loadHistory();
  }, [user]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Export history as PDF (Pro feature)
  const exportAsPdf = () => {
    if (!isPro) {
      toast.error('Export to PDF is a Pro feature');
      return;
    }
    
    toast.success('Exporting history as PDF');
    
    // Simulated export
    setTimeout(() => {
      toast.success('History exported successfully');
    }, 1500);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Trading History</h2>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex gap-2 items-center" 
          onClick={exportAsPdf}
          disabled={!isPro}
        >
          <Download size={16} />
          Export {!isPro && "(Pro)"}
        </Button>
      </div>
      
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>
            <Tabs defaultValue="trades">
              <TabsList>
                <TabsTrigger value="trades">Trade History</TabsTrigger>
                <TabsTrigger value="training">Training History</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Tabs defaultValue="trades">
            <TabsContent value="trades">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                </div>
              ) : tradeHistory.length > 0 ? (
                <div className="rounded-md border">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="h-12 px-4 text-left align-middle font-medium">Date & Time</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Market</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Prediction</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Confidence</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Outcome</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradeHistory.map((trade) => (
                          <tr key={trade.id} className="border-b">
                            <td className="p-4 align-middle">{formatDate(trade.timestamp)}</td>
                            <td className="p-4 align-middle">{trade.market}</td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-1">
                                {trade.prediction === 'rise' || trade.prediction === 'even' ? (
                                  <ArrowUp className="text-green-500 h-4 w-4" />
                                ) : (
                                  <ArrowDown className="text-red-500 h-4 w-4" />
                                )}
                                {trade.prediction.charAt(0).toUpperCase() + trade.prediction.slice(1)}
                              </div>
                            </td>
                            <td className="p-4 align-middle">{(trade.confidence * 100).toFixed(0)}%</td>
                            <td className="p-4 align-middle">
                              <span className={
                                trade.outcome === 'win' ? 'text-green-500' : 'text-red-500'
                              }>
                                {trade.outcome.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex rounded-full bg-primary/10 p-2 mb-4">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                  </div>
                  <p>No trade history found</p>
                  <p className="text-muted-foreground text-sm">
                    Make predictions to build your trading history
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="training">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                </div>
              ) : trainingHistory.length > 0 ? (
                <div className="rounded-md border">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Mission</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Points</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Accuracy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trainingHistory.map((training) => (
                          <tr key={training.id} className="border-b">
                            <td className="p-4 align-middle">{formatDate(training.date)}</td>
                            <td className="p-4 align-middle">{training.mission}</td>
                            <td className="p-4 align-middle">{training.points}</td>
                            <td className="p-4 align-middle">{(training.accuracy * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex rounded-full bg-primary/10 p-2 mb-4">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                  </div>
                  <p>No training history found</p>
                  <p className="text-muted-foreground text-sm">
                    Complete training missions to build your history
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="text-center text-xs text-muted-foreground mt-4">
        Copyright © 2025 Ruel McNeil
      </div>
    </div>
  );
};

export default History;
