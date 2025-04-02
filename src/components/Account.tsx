
// Import account component content from external file and modify it to:
// 1. Fix the Switch component TypeScript errors
// 2. Add PayPal integration for Pro upgrade
// 3. Update UI for settings changes to apply immediately
// 4. Add copyright and branding information

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import Logo from '@/components/Logo';
import PayPalCheckout from '@/components/PayPalCheckout';

const Account = () => {
  const { user, userDetails, updateUserDetails } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarUrl, setAvatarUrl] = useState(userDetails?.avatar_url || '');
  const [username, setUsername] = useState(userDetails?.username || '');
  const [fullName, setFullName] = useState(userDetails?.full_name || '');
  const [apiKey, setApiKey] = useState(userDetails?.api_key || '');
  const [wsUrl, setWsUrl] = useState(settings?.wsUrl || '');
  const [subscription, setSubscription] = useState(settings?.subscription || '');
  const [saveLoading, setSaveLoading] = useState(false);

  // Notifications states
  const [emailNotifications, setEmailNotifications] = useState(
    userDetails?.notifications?.email ?? true
  );
  const [appNotifications, setAppNotifications] = useState(
    userDetails?.notifications?.app ?? true
  );
  const [trainingNotifications, setTrainingNotifications] = useState(
    userDetails?.notifications?.training ?? true
  );
  const [predictionsNotifications, setPredictionsNotifications] = useState(
    userDetails?.notifications?.predictions ?? true
  );

  // Handle profile update
  const handleProfileUpdate = async () => {
    setSaveLoading(true);
    try {
      await updateUserDetails({
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
        api_key: apiKey,
        notifications: {
          email: emailNotifications,
          app: appNotifications,
          training: trainingNotifications,
          predictions: predictionsNotifications
        }
      });

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle settings update
  const updateSetting = async (key: string, value: any) => {
    try {
      // Create an object with the key-value pair
      const settingUpdate = { [key]: value };
      
      // Update the settings
      await updateSettings(settingUpdate);
      
      // Show success toast
      toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} updated`);
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      toast.error(`Failed to update ${key}`);
    }
  };

  // Handle WebSocket connection settings update
  const handleConnectionUpdate = async () => {
    setSaveLoading(true);
    try {
      await updateSettings({
        wsUrl,
        subscription
      });

      toast.success('Connection settings updated');
    } catch (error) {
      console.error('Error updating connection settings:', error);
      toast.error('Failed to update connection settings');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        {userDetails?.proStatus ? (
          <div className="flex items-center gap-2 bg-gradient-to-r from-primary/20 to-primary/0 rounded-md px-3 py-1.5">
            <Logo size={18} />
            <span className="font-semibold text-primary">PRO</span>
          </div>
        ) : null}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 max-w-md">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-lg">
                      {username?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileUpdate} disabled={saveLoading}>
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Your API Key"
                />
                <p className="text-xs text-muted-foreground">
                  Use this API key to access the NNticks API
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileUpdate} disabled={saveLoading}>
                  {saveLoading ? 'Saving...' : 'Save API Key'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme-selector">Theme</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={settings.theme === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('theme', 'dark')}
                    >
                      Dark
                    </Button>
                    <Button
                      variant={settings.theme === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('theme', 'light')}
                    >
                      Light
                    </Button>
                    <Button
                      variant={settings.theme === 'system' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('theme', 'system')}
                    >
                      System
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Accent Color</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="w-12 h-12 rounded-md bg-green-600"
                      variant="outline"
                      onClick={() => updateSetting('accent', 'green')}
                      style={{
                        outline: settings.accent === 'green' ? '2px solid white' : 'none',
                      }}
                    />
                    <Button
                      className="w-12 h-12 rounded-md bg-blue-600"
                      variant="outline"
                      onClick={() => updateSetting('accent', 'blue')}
                      style={{
                        outline: settings.accent === 'blue' ? '2px solid white' : 'none',
                      }}
                    />
                    <Button
                      className="w-12 h-12 rounded-md bg-purple-600"
                      variant="outline"
                      onClick={() => updateSetting('accent', 'purple')}
                      style={{
                        outline: settings.accent === 'purple' ? '2px solid white' : 'none',
                      }}
                    />
                    <Button
                      className="w-12 h-12 rounded-md bg-red-600"
                      variant="outline"
                      onClick={() => updateSetting('accent', 'red')}
                      style={{
                        outline: settings.accent === 'red' ? '2px solid white' : 'none',
                      }}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Font</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={settings.font === 'JetBrains Mono' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('font', 'JetBrains Mono')}
                      style={{ fontFamily: 'JetBrains Mono' }}
                    >
                      JetBrains Mono
                    </Button>
                    <Button
                      variant={settings.font === 'Fira Code' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('font', 'Fira Code')}
                      style={{ fontFamily: 'Fira Code' }}
                    >
                      Fira Code
                    </Button>
                    <Button
                      variant={settings.font === 'Roboto Mono' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('font', 'Roboto Mono')}
                      style={{ fontFamily: 'Roboto Mono' }}
                    >
                      Roboto Mono
                    </Button>
                    <Button
                      variant={settings.font === 'VT323' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('font', 'VT323')}
                      style={{ fontFamily: 'VT323' }}
                    >
                      VT323 (Pixel)
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Chart Style</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={settings.chartStyle === 'line' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('chartStyle', 'line')}
                    >
                      Line
                    </Button>
                    <Button
                      variant={settings.chartStyle === 'candlestick' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('chartStyle', 'candlestick')}
                    >
                      Candlestick
                    </Button>
                    <Button
                      variant={settings.chartStyle === 'bar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('chartStyle', 'bar')}
                    >
                      Bar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Layout Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="terminal-height">Terminal Height</Label>
                  <Input
                    id="terminal-height"
                    type="number"
                    className="w-24 text-right"
                    value={settings.terminalHeight}
                    onChange={(e) => updateSetting('terminalHeight', Number(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sidebar-width">Sidebar Width</Label>
                  <Input
                    id="sidebar-width"
                    type="number"
                    className="w-24 text-right"
                    value={settings.sidebarWidth}
                    onChange={(e) => updateSetting('sidebarWidth', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
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
                    <Label htmlFor="app-notifications">App Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications within the app
                    </p>
                  </div>
                  <Switch
                    id="app-notifications"
                    checked={appNotifications}
                    onCheckedChange={setAppNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="training-notifications">
                      Training Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when training completes
                    </p>
                  </div>
                  <Switch
                    id="training-notifications"
                    checked={trainingNotifications}
                    onCheckedChange={setTrainingNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="prediction-notifications">
                      Prediction Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about prediction results
                    </p>
                  </div>
                  <Switch
                    id="prediction-notifications"
                    checked={predictionsNotifications}
                    onCheckedChange={setPredictionsNotifications}
                  />
                </div>

                <div className="flex justify-end mt-4">
                  <Button onClick={handleProfileUpdate} disabled={saveLoading}>
                    {saveLoading ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6 mt-6">
          <div className="space-y-4">
            <PayPalCheckout />

            <Card>
              <CardHeader>
                <CardTitle>Connection Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ws-url">WebSocket URL</Label>
                    <Input
                      id="ws-url"
                      value={wsUrl}
                      onChange={(e) => setWsUrl(e.target.value)}
                      placeholder="wss://..."
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="subscription">Subscription JSON</Label>
                    <Input
                      id="subscription"
                      value={subscription}
                      onChange={(e) => setSubscription(e.target.value)}
                      placeholder='{"ticks":"R_10"}'
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleConnectionUpdate} disabled={saveLoading}>
                      {saveLoading ? 'Saving...' : 'Save Connection Settings'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Legal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <p>
                    NNticks is provided "as is" without warranty of any kind. By using this application, you agree to our Terms of Service and Privacy Policy.
                  </p>
                  <p>
                    Trading signals and predictions provided by this application are for informational purposes only and do not constitute financial advice.
                  </p>
                  <p>
                    © 2025 Ruel McNeil. All rights reserved.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-center text-xs text-muted-foreground py-4">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Logo size={14} />
          <span>NNticks</span>
        </div>
        <p>Version 1.0.0 • © 2025 Ruel McNeil. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Account;
