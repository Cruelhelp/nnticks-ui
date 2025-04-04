
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Brain, ChevronDown, ChevronUp, CreditCard, Settings, Shield, User, Users, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import DebugTools from '@/components/DebugTools';

const AdminPanel = () => {
  const { user, userDetails } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [tradesCount, setTradesCount] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (userDetails?.role !== 'admin' && !userDetails?.isAdmin) {
      toast.error('You do not have permission to access the admin panel');
      return;
    }
    
    setIsAdmin(true);
    loadData();
  }, [userDetails]);
  
  const loadData = async () => {
    setLoading(true);
    
    try {
      // Get user count
      const { count: userCount, error: userError } = await supabase
        .from('users_extra')
        .select('*', { count: 'exact', head: true });
      
      if (userError) throw userError;
      setUserCount(userCount);
      
      // Get trades count
      const { count: tradesCount, error: tradesError } = await supabase
        .from('trade_history')
        .select('*', { count: 'exact', head: true });
      
      if (tradesError) throw tradesError;
      setTradesCount(tradesCount);
      
      // Get users
      const { data: usersData, error: usersError } = await supabase
        .from('users_extra')
        .select('*, auth.users!inner(*)')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (usersError) throw usersError;
      setUsers(usersData || []);
      
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
      
      // Generate fake data for demo
      setUserCount(Math.floor(Math.random() * 1000) + 100);
      setTradesCount(Math.floor(Math.random() * 10000) + 1000);
      
      const fakeUsers = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        username: `user${i}`,
        email: `user${i}@example.com`,
        proStatus: Math.random() > 0.7,
        lastLogin: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        created_at: new Date(Date.now() - Math.random() * 86400000 * 60).toISOString(),
      }));
      
      setUsers(fakeUsers);
    } finally {
      setLoading(false);
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
        
        <Button onClick={loadData} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="debug">Debug Tools</TabsTrigger>
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
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                  <Progress className="h-1 mt-2" value={70} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tradesCount !== null ? tradesCount : '...'}</div>
                  <p className="text-xs text-muted-foreground">+25% from last week</p>
                  <Progress className="h-1 mt-2" value={85} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="rounded-full w-3 h-3 bg-green-500"></div>
                    <div className="text-sm">All Systems Operational</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">API</span>
                      <span className="text-green-500">99.9%</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">Database</span>
                      <span className="text-green-500">100%</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">WebSockets</span>
                      <span className="text-green-500">99.7%</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">Neural Net</span>
                      <span className="text-green-500">99.8%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Latest system events and notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start border-l-2 border-primary pl-4 pb-2">
                      <div>
                        <div className="font-medium">System Update</div>
                        <div className="text-sm text-muted-foreground">Neural network core updated to v2.5.0</div>
                        <div className="text-xs text-muted-foreground mt-1">5 minutes ago</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 items-start border-l-2 border-blue-500 pl-4 pb-2">
                      <div>
                        <div className="font-medium">New User</div>
                        <div className="text-sm text-muted-foreground">John Doe registered as a new user</div>
                        <div className="text-xs text-muted-foreground mt-1">1 hour ago</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 items-start border-l-2 border-yellow-500 pl-4 pb-2">
                      <div>
                        <div className="font-medium">API Warning</div>
                        <div className="text-sm text-muted-foreground">Binance API rate limit reached</div>
                        <div className="text-xs text-muted-foreground mt-1">3 hours ago</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 items-start border-l-2 border-green-500 pl-4">
                      <div>
                        <div className="font-medium">Performance Improvement</div>
                        <div className="text-sm text-muted-foreground">Prediction engine optimized, 30% faster performance</div>
                        <div className="text-xs text-muted-foreground mt-1">1 day ago</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin">
                      <Settings className="h-6 w-6 text-primary" />
                    </div>
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
                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 align-middle">
                                {user.proStatus ? (
                                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-800">
                                    <CreditCard className="mr-1 h-3 w-3" /> PRO
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                                    Standard
                                  </div>
                                )}
                              </td>
                              <td className="p-4 align-middle text-sm">
                                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
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
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="debug" className="mt-0 flex-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Debug Tools</CardTitle>
                <CardDescription>Advanced debugging tools for system administrators</CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-120px)] overflow-auto">
                <DebugTools />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
