
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Brain, Download, Shield, User, Users, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import WebSocketDebug from '@/components/WebSocketDebug';
import WebSocketStatus from '@/components/WebSocketStatus';
import { Badge } from '@/components/ui/badge';
import { TickData } from '@/types/chartTypes'; // Import TickData from chartTypes
import { persistentWebSocket } from '@/services/PersistentWebSocketService';

interface UserData {
  id: string;
  username?: string;
  email?: string;
  created_at: string;
  last_login?: string;
  proStatus?: boolean;
}

const UpdatedAdminPanel = () => {
  const { user, userDetails } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [tradesCount, setTradesCount] = useState<number | null>(null);
  const [epochsCount, setEpochsCount] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentTicks, setRecentTicks] = useState<TickData[]>([]);
  
  useEffect(() => {
    // Updated to use isAdmin property instead of role
    if (!userDetails?.isAdmin) {
      toast.error('You do not have permission to access the admin panel');
      return;
    }
    
    setIsAdmin(true);
    loadData();
    
    // Listen for ticks
    const handleTick = (tick: TickData) => {
      setRecentTicks(prev => {
        const newTicks = [...prev, tick];
        return newTicks.slice(-10); // Keep only last 10 ticks
      });
    };
    
    persistentWebSocket.on('tick', handleTick);
    
    return () => {
      persistentWebSocket.off('tick', handleTick);
    };
  }, [userDetails]);
  
  const loadData = async () => {
    setLoading(true);
    
    try {
      // Get user count
<<<<<<< HEAD
      let { count: userCount, error: userError } = await supabase
        .from('users_extra')
        .select('*', { count: 'exact', head: true });
      
=======
      const { count: userCountRaw, error: userError } = await supabase
        .from('users_extra')
        .select('*', { count: 'exact', head: true });
      let userCount = userCountRaw;
>>>>>>> 6e3fa6c (Initial commit: fix lint errors in Terminal.tsx, Index.tsx; update LINT_ISSUES_TRACKER.md; begin work on Login.tsx lint issues)
      // If users_extra table doesn't exist yet
      if (userError && userError.message.includes('does not exist')) {
        // Just set a placeholder value
        userCount = 0;
      } else if (userError) {
        throw userError;
      }
      
      setUserCount(userCount);
      
      // Get trades count
<<<<<<< HEAD
      let { count: tradesCount, error: tradesError } = await supabase
        .from('trade_history')
        .select('*', { count: 'exact', head: true });
      
=======
      const { count: tradesCountRaw, error: tradesError } = await supabase
        .from('trade_history')
        .select('*', { count: 'exact', head: true });
      let tradesCount = tradesCountRaw;
>>>>>>> 6e3fa6c (Initial commit: fix lint errors in Terminal.tsx, Index.tsx; update LINT_ISSUES_TRACKER.md; begin work on Login.tsx lint issues)
      if (tradesError && tradesError.message.includes('does not exist')) {
        tradesCount = 0;
      } else if (tradesError) {
        throw tradesError;
      }
      
      setTradesCount(tradesCount);
      
      // Get epochs count
<<<<<<< HEAD
      let { count: epochsCount, error: epochsError } = await supabase
        .from('epochs')
        .select('*', { count: 'exact', head: true });
      
=======
      const { count: epochsCountRaw, error: epochsError } = await supabase
        .from('epochs')
        .select('*', { count: 'exact', head: true });
      let epochsCount = epochsCountRaw;
>>>>>>> 6e3fa6c (Initial commit: fix lint errors in Terminal.tsx, Index.tsx; update LINT_ISSUES_TRACKER.md; begin work on Login.tsx lint issues)
      if (epochsError && epochsError.message.includes('does not exist')) {
        epochsCount = 0;
      } else if (epochsError) {
        throw epochsError;
      }
      
      setEpochsCount(epochsCount);
      
      // Get users - try the auth admin API first
      let usersData: UserData[] = [];
      try {
        // Try to fetch users from users_extra table
        const { data, error } = await supabase
          .from('users_extra')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error && !error.message.includes('does not exist')) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Successfully got users from users_extra
          usersData = data.map(user => ({
            id: user.user_id || user.id,
            username: user.username,
            email: user.email,
            created_at: user.created_at,
            last_login: user.last_login,
            proStatus: user.pro_status
          }));
        } else {
          // Try getting users from auth.users directly (requires admin rights)
          try {
            const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
            
            if (authError) throw authError;
            if (authUsers && authUsers.users) {
              usersData = authUsers.users.map(user => ({
                id: user.id,
                email: user.email,
                created_at: user.created_at || new Date().toISOString(),
                last_login: user.last_sign_in_at
              }));
            }
          } catch (authError) {
            console.error('Error loading users from auth:', authError);
            // Will fall back to demo data below
          }
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
      
      // If we couldn't get real users, use fake demo data
      if (usersData.length === 0) {
        // Generate fake data for demo
        const fakeUsers = Array.from({ length: 10 }, (_, i) => ({
          id: `id-${i}`,
          username: `user${i}`,
          email: `user${i}@example.com`,
          proStatus: Math.random() > 0.7,
          last_login: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
          created_at: new Date(Date.now() - Math.random() * 86400000 * 60).toISOString(),
        }));
        
        usersData = fakeUsers;
      }
      
      setUsers(usersData);
      
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
      
      // Generate fake data for demo
      setUserCount(Math.floor(Math.random() * 1000) + 100);
      setTradesCount(Math.floor(Math.random() * 10000) + 1000);
      setEpochsCount(Math.floor(Math.random() * 500) + 50);
      
      const fakeUsers = Array.from({ length: 10 }, (_, i) => ({
        id: `id-${i}`,
        username: `user${i}`,
        email: `user${i}@example.com`,
        proStatus: Math.random() > 0.7,
        last_login: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        created_at: new Date(Date.now() - Math.random() * 86400000 * 60).toISOString(),
      }));
      
      setUsers(fakeUsers);
    } finally {
      setLoading(false);
    }
  };
  
  const exportUserData = () => {
    try {
      const dataStr = JSON.stringify(users, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileName = `users-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
      
      toast.success('User data exported successfully');
    } catch (error) {
      toast.error('Failed to export user data');
    }
  };
  
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-yellow-500">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Access Restricted</CardTitle>
            </div>
            <CardDescription>
              You need administrator privileges to access this section.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage your NNticks platform</p>
        </div>
        
        <div className="flex items-center gap-4">
          <WebSocketStatus compact showTickInfo />
          
          <Button onClick={loadData} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="debug">WebSocket Debug</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-auto">
          <TabsContent value="overview" className="mt-0 flex-1">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userCount !== null ? userCount : '...'}</div>
                  <p className="text-xs text-muted-foreground">Registered platform users</p>
                  <Progress className="h-1 mt-2" value={70} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tradesCount !== null ? tradesCount : '...'}</div>
                  <p className="text-xs text-muted-foreground">Trading history records</p>
                  <Progress className="h-1 mt-2" value={85} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Epochs Collected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{epochsCount !== null ? epochsCount : '...'}</div>
                  <p className="text-xs text-muted-foreground">Total training epochs</p>
                  <Progress className="h-1 mt-2" value={55} />
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>WebSocket Status</CardTitle>
                  <CardDescription>Real-time market data connection status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border rounded-md">
                      <WebSocketStatus showTickInfo showControls />
                      <Badge variant="outline">
                        ID: 70997
                      </Badge>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="text-sm font-medium mb-2">Recent Ticks</h3>
                      {recentTicks.length > 0 ? (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {recentTicks.map((tick, index) => (
                            <div key={index} className="flex justify-between text-sm border-b pb-1">
                              <span>{new Date(tick.timestamp).toLocaleTimeString()}</span>
                              <span className="font-medium">{tick.value}</span>
                              <span className="text-muted-foreground">{tick.market}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No ticks received yet</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          persistentWebSocket.setSubscription({ ticks: 'R_10' });
                          toast.success('Switched to Volatility 10 Index');
                        }}
                      >
                        Switch to R_10
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          persistentWebSocket.setSubscription({ ticks: 'R_100' });
                          toast.success('Switched to Volatility 100 Index');
                        }}
                      >
                        Switch to R_100
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Latest system events and notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start border-l-2 border-green-500 pl-4 pb-2">
                      <div>
                        <div className="font-medium">WebSocket Connected</div>
                        <div className="text-sm text-muted-foreground">Persistent connection established</div>
                        <div className="text-xs text-muted-foreground mt-1">Just now</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 items-start border-l-2 border-primary pl-4 pb-2">
                      <div>
                        <div className="font-medium">System Update</div>
                        <div className="text-sm text-muted-foreground">WebSocket implementation upgraded</div>
                        <div className="text-xs text-muted-foreground mt-1">5 minutes ago</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 items-start border-l-2 border-blue-500 pl-4 pb-2">
                      <div>
                        <div className="font-medium">Epoch Collection</div>
                        <div className="text-sm text-muted-foreground">Neural network training data being collected</div>
                        <div className="text-xs text-muted-foreground mt-1">10 minutes ago</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 items-start border-l-2 border-yellow-500 pl-4">
                      <div>
                        <div className="font-medium">User Activity</div>
                        <div className="text-sm text-muted-foreground">New session started</div>
                        <div className="text-xs text-muted-foreground mt-1">30 minutes ago</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage user accounts</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportUserData}
                  disabled={users.length === 0}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Export Users
                </Button>
              </CardHeader>
              
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin">
                      <RefreshCw className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-10 border rounded-md">
                    <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <h3 className="text-lg font-medium">No Users Found</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                      There are no users in your database yet or there was an error fetching them.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="h-12 px-4 text-left align-middle font-medium">User</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Last Login</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id} className="border-b">
                              <td className="p-4 align-middle">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-full bg-muted p-2">
                                    <User className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{user.username || 'No username'}</div>
                                    <div className="text-xs text-muted-foreground">{user.email || 'No email'}</div>
                                    <div className="text-xs text-muted-foreground">ID: {user.id.substring(0, 8)}...</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 align-middle">
                                {user.proStatus ? (
                                  <Badge className="bg-green-500">PRO</Badge>
                                ) : (
                                  <Badge variant="outline">Standard</Badge>
                                )}
                              </td>
                              <td className="p-4 align-middle text-sm">
                                {user.last_login ? 
                                  new Date(user.last_login).toLocaleString() : 
                                  'Never'
                                }
                              </td>
                              <td className="p-4 align-middle">
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <User className="h-4 w-4 mr-1" /> View
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Shield className="h-4 w-4 mr-1" /> Manage
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">
                  Showing {users.length} of {userCount || 0} users
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm" disabled>Next</Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="debug" className="mt-0 flex-1">
            <WebSocketDebug />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default UpdatedAdminPanel;
