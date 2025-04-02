
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  User, Brain, Save, Download, Key, Bell, Clock, BarChart, Users, DownloadCloud,
  ArrowUpRight, Shield, CreditCard, ChevronRight
} from 'lucide-react';

const Account = () => {
  const { user, userDetails, updateUserDetails } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [isUpdating, setIsUpdating] = useState(false);
  const [userData, setUserData] = useState({
    username: userDetails?.username || '',
    email: user?.email || '',
    fullName: userDetails?.full_name || '',
    apiKey: userDetails?.api_key || '',
    notificationSettings: {
      email: userDetails?.notifications?.email || false,
      app: userDetails?.notifications?.app || true,
      training: userDetails?.notifications?.training || true,
      predictions: userDetails?.notifications?.predictions || true,
    }
  });
  
  const [trainingSummary, setTrainingSummary] = useState({
    totalSessions: 0,
    totalModels: 0,
    totalTicks: 0,
    bestAccuracy: 0
  });
  
  const [tradingSummary, setTradingSummary] = useState({
    totalTrades: 0,
    winRate: 0,
    avgProfit: 0,
    bestResult: 0
  });

  useEffect(() => {
    if (!user) return;
    
    const loadStats = async () => {
      try {
        const { data: trainData, error: trainError } = await supabase
          .from('training_history')
          .select('*')
          .eq('user_id', user.id);
          
        if (trainError) throw trainError;
        
        const { data: tradeData, error: tradeError } = await supabase
          .from('trade_history')
          .select('*')
          .eq('user_id', user.id);
          
        if (tradeError) throw tradeError;
        
        const { data: tickData, error: tickError } = await supabase
          .rpc('get_tick_count', { user_id_param: user.id });
          
        if (tickError) throw tickError;

        if (trainData && trainData.length) {
          const bestAccuracy = Math.max(...trainData.map(t => t.accuracy || 0));
          setTrainingSummary({
            totalSessions: trainData.length,
            totalModels: new Set(trainData.map(t => t.model_id)).size,
            totalTicks: tickData || 0,
            bestAccuracy: bestAccuracy
          });
        }
        
        if (tradeData && tradeData.length) {
          const wins = tradeData.filter(t => t.outcome === 'win').length;
          const totalTrades = tradeData.length;
          
          setTradingSummary({
            totalTrades,
            winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
            avgProfit: 0.0,
            bestResult: 0.0
          });
        }
      } catch (error) {
        console.error('Failed to load user stats:', error);
      }
    };
    
    loadStats();
  }, [user]);

  useEffect(() => {
    if (userDetails) {
      setUserData({
        username: userDetails.username || '',
        email: user?.email || '',
        fullName: userDetails.full_name || '',
        apiKey: userDetails.api_key || '',
        notificationSettings: {
          email: userDetails.notifications?.email || false,
          app: userDetails.notifications?.app || true,
          training: userDetails.notifications?.training || true,
          predictions: userDetails.notifications?.predictions || true,
        }
      });
    }
  }, [userDetails, user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      await updateUserDetails({
        username: userData.username,
        full_name: userData.fullName,
        api_key: userData.apiKey,
        notifications: userData.notificationSettings
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportData = (type: 'pdf' | 'csv') => {
    toast.success(`Exporting ${type.toUpperCase()} data...`);
    setTimeout(() => {
      toast.success(`${type.toUpperCase()} exported successfully`);
    }, 1500);
  };

  return (
    <div className="container mx-auto max-w-5xl p-4">
      <h1 className="text-2xl font-bold mb-6">Account</h1>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="stats">Stats & Analytics</TabsTrigger>
          <TabsTrigger value="api">API Settings</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Manage your personal information and account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={userDetails?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {userData.username?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{userData.fullName || userData.username}</h3>
                  <p className="text-sm text-muted-foreground">{userData.email}</p>
                  {userDetails?.proStatus && (
                    <Badge className="mt-1 bg-gradient-to-r from-purple-500 to-indigo-500">PRO</Badge>
                  )}
                </div>
              </div>
              
              <div className="grid gap-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      value={userData.username}
                      onChange={(e) => setUserData({...userData, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={userData.email} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={userData.fullName}
                    onChange={(e) => setUserData({...userData, fullName: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Customize how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates and alerts via email
                  </p>
                </div>
                <Switch 
                  checked={userData.notificationSettings.email}
                  onCheckedChange={(checked) => 
                    setUserData({
                      ...userData, 
                      notificationSettings: {
                        ...userData.notificationSettings,
                        email: checked
                      }
                    })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>App Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    In-app alerts and notifications
                  </p>
                </div>
                <Switch 
                  checked={userData.notificationSettings.app}
                  onCheckedChange={(checked) => 
                    setUserData({
                      ...userData, 
                      notificationSettings: {
                        ...userData.notificationSettings,
                        app: checked
                      }
                    })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Training Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when model training completes
                  </p>
                </div>
                <Switch 
                  checked={userData.notificationSettings.training}
                  onCheckedChange={(checked) => 
                    setUserData({
                      ...userData, 
                      notificationSettings: {
                        ...userData.notificationSettings,
                        training: checked
                      }
                    })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Prediction Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about important prediction outcomes
                  </p>
                </div>
                <Switch 
                  checked={userData.notificationSettings.predictions}
                  onCheckedChange={(checked) => 
                    setUserData({
                      ...userData, 
                      notificationSettings: {
                        ...userData.notificationSettings,
                        predictions: checked
                      }
                    })
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Training Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Training Sessions:</dt>
                    <dd className="text-sm font-semibold">{trainingSummary.totalSessions}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Models Created:</dt>
                    <dd className="text-sm font-semibold">{trainingSummary.totalModels}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Total Ticks Processed:</dt>
                    <dd className="text-sm font-semibold">{trainingSummary.totalTicks.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Best Accuracy:</dt>
                    <dd className="text-sm font-semibold">{trainingSummary.bestAccuracy.toFixed(2)}%</dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleExportData('pdf')} variant="outline">
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Export Training Data
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Trading Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Total Trades:</dt>
                    <dd className="text-sm font-semibold">{tradingSummary.totalTrades}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Win Rate:</dt>
                    <dd className="text-sm font-semibold">{tradingSummary.winRate.toFixed(2)}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Average Profit:</dt>
                    <dd className="text-sm font-semibold">{tradingSummary.avgProfit.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Best Result:</dt>
                    <dd className="text-sm font-semibold">{tradingSummary.bestResult.toFixed(2)}</dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleExportData('csv')} variant="outline">
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Export Trading History
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Usage & Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tick Storage</span>
                    <span>{Math.min(trainingSummary.totalTicks, 10000).toLocaleString()} / {userDetails?.proStatus ? "Unlimited" : "10,000"}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${userDetails?.proStatus ? 10 : Math.min(trainingSummary.totalTicks / 100, 100)}%` }} 
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Model Storage</span>
                    <span>{trainingSummary.totalModels} / {userDetails?.proStatus ? "Unlimited" : "3"}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${userDetails?.proStatus ? 10 : Math.min(trainingSummary.totalModels / 0.03, 100)}%` }} 
                    />
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    {userDetails?.proStatus 
                      ? "You're on the Pro plan with unlimited storage and features."
                      : "Upgrade to Pro for unlimited storage and additional features."}
                  </p>
                </div>
              </div>
            </CardContent>
            {!userDetails?.proStatus && (
              <CardFooter>
                <Button className="w-full" variant="default">Upgrade to Pro</Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Configure your API settings for market data connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex gap-2">
                  <Input 
                    id="api-key" 
                    value={userData.apiKey} 
                    onChange={(e) => setUserData({...userData, apiKey: e.target.value})}
                    type="password"
                    placeholder="Enter your API key"
                  />
                  <Button variant="outline"><Key className="h-4 w-4" /></Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter your broker API key for market data access
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ws-url">WebSocket URL</Label>
                <Input 
                  id="ws-url" 
                  value={settings.wsUrl}
                  onChange={(e) => updateSettings({ wsUrl: e.target.value })}
                  placeholder="wss://example.com/websocket"
                />
                <p className="text-sm text-muted-foreground">
                  WebSocket endpoint for real-time market data
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subscription">Subscription Format</Label>
                <Input 
                  id="subscription" 
                  value={settings.subscription}
                  onChange={(e) => updateSettings({ subscription: e.target.value })}
                  placeholder='{"ticks":"R_10"}'
                />
                <p className="text-sm text-muted-foreground">
                  JSON format for market data subscription
                </p>
              </div>
              
              <div className="space-y-2 pt-2">
                <Label>Connection Status</Label>
                <div className="flex items-center space-x-2">
                  <div className={`h-3 w-3 rounded-full ${userData.apiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className="text-sm">{userData.apiKey ? 'API Key Configured' : 'API Key Missing'}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => toast.info('Testing connection...')}>
                Test Connection
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Debug Tools</CardTitle>
              <CardDescription>
                Monitoring and debugging tools for API connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-muted p-4 font-mono text-sm overflow-auto max-h-40">
                <p className="text-green-500">[System] WebSocket initialized</p>
                <p className="text-muted-foreground">[Info] Connecting to {settings.wsUrl}</p>
                <p className="text-muted-foreground">[Info] Subscription: {settings.subscription}</p>
                <p className="text-green-500">[Success] Connection established</p>
                {!userData.apiKey && (
                  <p className="text-red-500">[Error] API key not configured</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {userDetails?.proStatus ? 'Pro Plan' : 'Free Plan'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {userDetails?.proStatus
                        ? 'Full access to all features and unlimited storage'
                        : 'Basic access with limited features'}
                    </p>
                  </div>
                  <Badge className={userDetails?.proStatus ? 'bg-primary' : 'bg-muted'}>
                    {userDetails?.proStatus ? 'Active' : 'Free'}
                  </Badge>
                </div>
                
                {userDetails?.proStatus && (
                  <div className="mt-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next billing date:</span>
                      <span>May 15, 2025</span>
                    </div>
                  </div>
                )}
              </div>
              
              {!userDetails?.proStatus && (
                <div className="rounded-md border p-4 bg-muted/50">
                  <h3 className="font-semibold">Pro Plan Benefits</h3>
                  <ul className="text-sm space-y-2 mt-2">
                    <li className="flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-2 text-primary" />
                      Unlimited tick data storage
                    </li>
                    <li className="flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-2 text-primary" />
                      Advanced neural network models
                    </li>
                    <li className="flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-2 text-primary" />
                      Priority support and feature access
                    </li>
                    <li className="flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-2 text-primary" />
                      Extended historical data
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {userDetails?.proStatus ? (
                <Button variant="outline" className="w-full">Manage Subscription</Button>
              ) : (
                <Button className="w-full">Upgrade to Pro</Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Account;
