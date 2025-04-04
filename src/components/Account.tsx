import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/useSettings';
import Logo from '@/components/Logo';
import PayPalCheckout from '@/components/PayPalCheckout';
import { supabase } from '@/lib/supabase';

const Account = () => {
  const { user, userDetails, updateUserDetails, refreshUserDetails } = useAuth();
  const { settings, updateSettings } = useSettings();
  
  const [username, setUsername] = useState(userDetails?.username || '');
  const [activeTab, setActiveTab] = useState('general');
  const [theme, setTheme] = useState(settings?.theme || 'dark');
  const [accent, setAccent] = useState(settings?.accent || 'green');
  const [font, setFont] = useState<UserSettings['font']>(settings?.font || 'default');
  const [wsUrl, setWsUrl] = useState(settings?.wsUrl || '');
  const [subscription, setSubscription] = useState(settings?.subscription || '');
  const [saveLoading, setSaveLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notifications states
  const [emailNotifications, setEmailNotifications] = useState(
    settings?.notifications?.email || false
  );
  const [predictionAlerts, setPredictionAlerts] = useState(
    settings?.notifications?.predictions || true
  );
  const [trainingAlerts, setTrainingAlerts] = useState(
    settings?.notifications?.training || true
  );
  const [marketAlerts, setMarketAlerts] = useState(
    settings?.notifications?.market || false
  );
  
  useEffect(() => {
    if (userDetails) {
      setUsername(userDetails.username || '');
    }
  }, [userDetails]);
  
  useEffect(() => {
    if (settings) {
      setTheme(settings.theme || 'dark');
      setAccent(settings.accent || 'green');
      setFont(settings.font || 'default');
      setWsUrl(settings.wsUrl || '');
      setSubscription(settings.subscription || '');
      
      // Set notification settings
      setEmailNotifications(settings.notifications?.email || false);
      setPredictionAlerts(settings.notifications?.predictions || true);
      setTrainingAlerts(settings.notifications?.training || true);
      setMarketAlerts(settings.notifications?.market || false);
    }
  }, [settings]);
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You need to be logged in to update your profile');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateUserDetails({ username });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSettingsUpdate = async () => {
    setSaveLoading(true);
    
    try {
      await updateSettings({
        theme,
        accent,
        font,
        wsUrl,
        subscription,
        notifications: {
          email: emailNotifications,
          predictions: predictionAlerts,
          training: trainingAlerts,
          market: marketAlerts
        }
      });
      
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update connection settings');
    } finally {
      setSaveLoading(false);
    }
  };
  
  const handleAvatarClick = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const saveToast = toast.loading('Uploading avatar...');
      
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        await updateUserDetails({ avatarUrl: publicUrl });
        
        toast.dismiss(saveToast);
        toast.success('Avatar updated successfully');
        
        await refreshUserDetails();
      } catch (error) {
        console.error('Error uploading avatar:', error);
        toast.dismiss(saveToast);
        toast.error('Failed to upload avatar');
      }
    };
    input.click();
  };
  
  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your account information and avatar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center space-y-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={userDetails?.avatarUrl || ''} />
                    <AvatarFallback className="text-2xl">
                      {username ? username.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm" onClick={handleAvatarClick}>
                    Change Avatar
                  </Button>
                </div>
                
                <div className="flex-1 space-y-4">
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email can only be changed in your Supabase account settings
                      </p>
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="font-medium">Subscription</h3>
                <div className="bg-muted/50 rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">
                        {userDetails?.proStatus ? 'Pro Plan' : 'Free Plan'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {userDetails?.proStatus 
                          ? 'Unlimited predictions and advanced neural network features' 
                          : 'Basic prediction features with limited usage'}
                      </p>
                    </div>
                    {!userDetails?.proStatus && (
                      <Button variant="default">Upgrade to Pro</Button>
                    )}
                  </div>
                </div>
                
                {!userDetails?.proStatus && (
                  <div className="mt-4">
                    <PayPalCheckout />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="prediction-alerts">Prediction Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about prediction results
                  </p>
                </div>
                <Switch
                  id="prediction-alerts"
                  checked={predictionAlerts}
                  onCheckedChange={setPredictionAlerts}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="training-alerts">Training Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when model training is complete
                  </p>
                </div>
                <Switch
                  id="training-alerts"
                  checked={trainingAlerts}
                  onCheckedChange={setTrainingAlerts}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="market-alerts">Market Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about significant market changes
                  </p>
                </div>
                <Switch
                  id="market-alerts"
                  checked={marketAlerts}
                  onCheckedChange={setMarketAlerts}
                />
              </div>
              
              <Button onClick={handleSettingsUpdate} disabled={saveLoading}>
                {saveLoading ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setTheme('dark')}
                    >
                      <span className="w-4 h-4 rounded-full bg-black mr-2"></span>
                      Dark
                    </Button>
                    <Button
                      type="button"
                      variant={theme === 'light' ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setTheme('light')}
                    >
                      <span className="w-4 h-4 rounded-full bg-white border mr-2"></span>
                      Light
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      type="button"
                      variant={accent === 'green' ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setAccent('green')}
                    >
                      <span className="w-4 h-4 rounded-full bg-green-500 mr-2"></span>
                      Green
                    </Button>
                    <Button
                      type="button"
                      variant={accent === 'blue' ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setAccent('blue')}
                    >
                      <span className="w-4 h-4 rounded-full bg-blue-500 mr-2"></span>
                      Blue
                    </Button>
                    <Button
                      type="button"
                      variant={accent === 'purple' ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setAccent('purple')}
                    >
                      <span className="w-4 h-4 rounded-full bg-purple-500 mr-2"></span>
                      Purple
                    </Button>
                    <Button
                      type="button"
                      variant={accent === 'red' ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setAccent('red')}
                    >
                      <span className="w-4 h-4 rounded-full bg-red-500 mr-2"></span>
                      Red
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Font</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={font === 'default' ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setFont('default')}
                    >
                      Default
                    </Button>
                    <Button
                      type="button"
                      variant={font === 'JetBrains Mono' ? 'default' : 'outline'}
                      className="justify-start font-mono"
                      onClick={() => setFont('JetBrains Mono')}
                    >
                      Monospace
                    </Button>
                    <Button
                      type="button"
                      variant={font === 'sans-serif' ? 'default' : 'outline'}
                      className="justify-start font-sans"
                      onClick={() => setFont('sans-serif')}
                    >
                      Sans-serif
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleSettingsUpdate} disabled={saveLoading}>
                {saveLoading ? 'Saving...' : 'Save Appearance Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Connections</CardTitle>
              <CardDescription>
                Manage connections to WebSocket APIs and data sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ws-url">WebSocket URL</Label>
                  <Input
                    id="ws-url"
                    value={wsUrl}
                    onChange={(e) => setWsUrl(e.target.value)}
                    placeholder="wss://ws.binaryws.com/websockets/v3?app_id=1089"
                  />
                  <p className="text-xs text-muted-foreground">
                    WebSocket endpoint for real-time market data
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subscription">Subscription Format</Label>
                  <Input
                    id="subscription"
                    value={subscription}
                    onChange={(e) => setSubscription(e.target.value)}
                    placeholder='{"ticks":"R_10"}'
                  />
                  <p className="text-xs text-muted-foreground">
                    JSON subscription format for your WebSocket connection
                  </p>
                </div>
                
                <div className="bg-muted/50 rounded-md p-4 space-y-2">
                  <h4 className="font-medium">Connection Presets</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWsUrl('wss://ws.binaryws.com/websockets/v3?app_id=1089');
                        setSubscription('{"ticks":"R_10"}');
                      }}
                    >
                      Binary.com R_10
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWsUrl('wss://ws.binaryws.com/websockets/v3?app_id=1089');
                        setSubscription('{"ticks":"R_25"}');
                      }}
                    >
                      Binary.com R_25
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWsUrl('wss://ws.binaryws.com/websockets/v3?app_id=1089');
                        setSubscription('{"ticks":"R_50"}');
                      }}
                    >
                      Binary.com R_50
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWsUrl('wss://ws.binaryws.com/websockets/v3?app_id=1089');
                        setSubscription('{"ticks":"R_100"}');
                      }}
                    >
                      Binary.com R_100
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleSettingsUpdate} disabled={saveLoading}>
                {saveLoading ? 'Saving...' : 'Save Connection Settings'}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for external services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">Binary.com API Key (Optional)</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter your API key"
                />
              </div>
              
              <Button variant="outline">
                Save API Keys
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 text-center">
        <Logo className="h-8 mx-auto opacity-50" />
        <p className="text-xs text-muted-foreground mt-2">
          NNticks Neural Network Trading Platform
          <br />
          Version 1.0.0
        </p>
      </div>
    </div>
  );
};

export default Account;
