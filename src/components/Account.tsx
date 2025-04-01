
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { User, Brain, Save, Download, Key, Clock, BarChart, Users, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Account = () => {
  const { user, userDetails, updateUserDetails } = useAuth();
  const { settings } = useSettings();
  const [isUpdating, setIsUpdating] = useState(false);
  const [userData, setUserData] = useState({
    username: userDetails?.username || '',
    email: user?.email || '',
    fullName: userDetails?.full_name || '',
    apiKey: userDetails?.api_key || '',
    notifications: {
      email: true,
      app: true,
      predictions: true,
      training: true
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
  
  // Load user stats
  useEffect(() => {
    if (!user) return;
    
    const loadStats = async () => {
      try {
        // Load training stats
        const { data: trainData, error: trainError } = await supabase
          .from('training_history')
          .select('*')
          .eq('user_id', user.id);
          
        if (trainError) throw trainError;
        
        // Load trade stats
        const { data: tradeData, error: tradeError } = await supabase
          .from('trade_history')
          .select('*')
          .eq('user_id', user.id);
          
        if (tradeError) throw tradeError;
        
        // Load tick stats
        const { data: tickData, error: tickError } = await supabase
          .rpc('get_tick_count', { user_id_param: user.id });
          
        if (tickError) throw tickError;

        // Process training stats
        if (trainData && trainData.length) {
          const bestAccuracy = Math.max(...trainData.map(t => t.accuracy || 0));
          setTrainingSummary({
            totalSessions: trainData.length,
            totalModels: new Set(trainData.map(t => t.model_id)).size,
            totalTicks: tickData || 0,
            bestAccuracy: bestAccuracy
          });
        }
        
        // Process trading stats
        if (tradeData && tradeData.length) {
          const wins = tradeData.filter(t => t.outcome === 'win').length;
          const totalTrades = tradeData.length;
          
          setTradingSummary({
            totalTrades,
            winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
            avgProfit: 0.0, // We don't track actual profit in this demo
            bestResult: 0.0
          });
        }
      } catch (error) {
        console.error('Failed to load user stats:', error);
      }
    };
    
    loadStats();
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      // Update user details in Supabase
      await updateUserDetails({
        username: userData.username,
        full_name: userData.fullName,
        api_key: userData.apiKey,
        notifications: userData.notifications
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
      toast.success(`Data exported as ${type.toUpperCase()}`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="api">API Settings</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and profile settings
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
                    <Badge className="mt-1">PRO</Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
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
              
              <div className="space-y-4 pt-4">
                <h4 className="text-sm font-medium">Notification Preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailNotification" className="flex items-center gap-2">
                      Email Notifications
                    </Label>
                    <Switch 
                      id="emailNotification" 
                      checked={userData.notifications.email}
                      onCheckedChange={(checked) => {
                        setUserData({
                          ...userData,
                          notifications: {
                            ...userData.notifications,
                            email: checked
                          }
                        })
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="appNotification" className="flex items-center gap-2">
                      App Notifications
                    </Label>
                    <Switch 
                      id="appNotification" 
                      checked={userData.notifications.app}
                      onCheckedChange={(checked) => {
                        setUserData({
                          ...userData,
                          notifications: {
                            ...userData.notifications,
                            app: checked
                          }
                        })
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="predictionNotification" className="flex items-center gap-2">
                      Prediction Notifications
                    </Label>
                    <Switch 
                      id="predictionNotification" 
                      checked={userData.notifications.predictions}
                      onCheckedChange={(checked) => {
                        setUserData({
                          ...userData,
                          notifications: {
                            ...userData.notifications,
                            predictions: checked
                          }
                        })
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="trainingNotification" className="flex items-center gap-2">
                      Training Notifications
                    </Label>
                    <Switch 
                      id="trainingNotification" 
                      checked={userData.notifications.training}
                      onCheckedChange={(checked) => {
                        setUserData({
                          ...userData,
                          notifications: {
                            ...userData.notifications,
                            training: checked
                          }
                        })
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
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
                    <dt className="text-sm font-medium text-muted-foreground">Total Ticks:</dt>
                    <dd className="text-sm font-semibold">{trainingSummary.totalTicks}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Best Accuracy:</dt>
                    <dd className="text-sm font-semibold">{trainingSummary.bestAccuracy.toFixed(2)}%</dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleExportData('pdf')} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Training Data (PDF)
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
                  <FileText className="mr-2 h-4 w-4" />
                  Export Trading History (CSV)
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Usage & Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tick Storage</span>
                    <span>{Math.min(trainingSummary.totalTicks, 10000)} / {userDetails?.proStatus ? "Unlimited" : "10,000"}</span>
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
              </div>
            </CardContent>
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
                <Label htmlFor="apiKey">API Key</Label>
                <div className="flex gap-2">
                  <Input 
                    id="apiKey" 
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
                <Label htmlFor="wsUrl">WebSocket URL</Label>
                <Input 
                  id="wsUrl" 
                  value={settings.wsUrl || ''}
                  disabled
                  placeholder="wss://example.com/websocket"
                />
                <p className="text-sm text-muted-foreground">
                  This can be configured in Settings
                </p>
              </div>
              
              <div className="pt-2">
                <div className="rounded-md bg-muted p-4 text-sm">
                  <h4 className="font-medium">Connection Status</h4>
                  <div className="mt-2 flex items-center">
                    <div className={`h-3 w-3 rounded-full ${userData.apiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="ml-2">
                      {userData.apiKey ? 'API Key Configured' : 'API Key Missing'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>
                Customize your NNticks experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">Eastern Standard Time</SelectItem>
                    <SelectItem value="pst">Pacific Standard Time</SelectItem>
                    <SelectItem value="gmt">Greenwich Mean Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-medium">Privacy Options</h4>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="analytics" className="flex items-center gap-2">
                    Allow Analytics
                  </Label>
                  <Switch id="analytics" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="marketing" className="flex items-center gap-2">
                    Marketing Communications
                  </Label>
                  <Switch id="marketing" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Account;
