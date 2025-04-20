import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  accuracy: number;
  level: number;
  rank?: number;
}

const Leaderboard = () => {
  const { user, userDetails } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  
  const isPro = userDetails?.proStatus || false;
  
  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!isPro) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('leaderboard')
          .select('*')
          .order('accuracy', { ascending: false })
          .limit(10);
          
        if (error) throw error;
        
        if (data) {
          // Add rank to each entry
          const rankedEntries = data.map((entry, index) => ({
            ...entry,
            rank: index + 1
          }));
          
          setEntries(rankedEntries);
          
          // Find user's entry if they're on the leaderboard
          if (user) {
            const userEntryData = rankedEntries.find(entry => entry.user_id === user.id);
            if (userEntryData) {
              setUserEntry(userEntryData);
            }
          }
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    
    loadLeaderboard();
  }, [user, isPro]);
  
  // Get badge for top 3 ranks
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    } else if (rank === 2) {
      return <Medal className="h-5 w-5 text-gray-400" />;
    } else if (rank === 3) {
      return <Medal className="h-5 w-5 text-amber-700" />;
    } else {
      return <span className="font-mono text-muted-foreground">{rank}</span>;
    }
  };
  
  // Get level badge
  const getLevelBadge = (level: number) => {
    return (
      <Badge 
        variant="outline" 
        className={
          level === 1 ? 'bg-slate-200 text-slate-800' :
          level === 2 ? 'bg-blue-200 text-blue-800' :
          level === 3 ? 'bg-purple-200 text-purple-800' :
          level === 4 ? 'bg-amber-200 text-amber-800' :
          'bg-red-200 text-red-800'
        }
      >
        Level {level}
      </Badge>
    );
  };
  
  if (!isPro) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Pro Feature</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Trophy size={64} className="mx-auto mb-4 text-muted" />
            <p className="mb-4">
              The leaderboard is available exclusively for Pro users.
            </p>
            <p className="text-sm text-muted-foreground">
              Upgrade to Pro to compare your performance with other traders.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Top Traders Leaderboard</h2>
      
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          ) : entries.length > 0 ? (
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="h-12 px-4 text-left align-middle font-medium">Rank</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Trader</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Level</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr 
                        key={entry.user_id} 
                        className={`border-b ${entry.user_id === user?.id ? 'bg-primary/5' : ''}`}
                      >
                        <td className="p-4 align-middle">
                          <div className="flex items-center justify-center">
                            {getRankBadge(entry.rank!)}
                          </div>
                        </td>
                        <td className="p-4 align-middle font-medium">
                          {entry.username}
                          {entry.user_id === user?.id && (
                            <span className="ml-2 text-xs text-primary">(You)</span>
                          )}
                        </td>
                        <td className="p-4 align-middle">
                          {getLevelBadge(entry.level)}
                        </td>
                        <td className="p-4 align-middle text-right">
                          {(entry.accuracy * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <Trophy size={64} className="mx-auto mb-4 text-muted" />
              <p>No leaderboard data available yet</p>
              <p className="text-sm text-muted-foreground">
                Complete training missions to appear on the leaderboard
              </p>
            </div>
          )}
          
          {entries.length > 0 && !userEntry && user && (
            <div className="mt-6 p-4 border rounded-md bg-muted/10">
              <p className="text-center text-sm">
                Complete training missions to appear on the leaderboard!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="text-center text-xs text-muted-foreground mt-4">
        Copyright 2025 Ruel McNeil
      </div>
    </div>
  );
};

export default Leaderboard;
