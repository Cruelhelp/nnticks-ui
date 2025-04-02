import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { useSettings, DEFAULT_SETTINGS, UserSettings } from '@/hooks/useSettings';

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FontOption = 'JetBrains Mono' | 'Fira Code' | 'Courier New' | 'Consolas' | 'Menlo' | 'Monaco' | 'Roboto Mono' | 'Source Code Pro' | 'VT323';
type AccentColor = 'green' | 'blue' | 'purple' | 'red';
type ChartStyle = 'line' | 'candlestick' | 'bar';

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);
  
  const handleThemeChange = (theme: string) => {
    setLocalSettings({ ...localSettings, theme });
  };
  
  const handleAccentChange = (accent: AccentColor) => {
    setLocalSettings({ ...localSettings, accent });
  };
  
  const handleFontChange = (font: FontOption) => {
    setLocalSettings({ ...localSettings, font });
  };
  
  const handleChartStyleChange = (chartStyle: ChartStyle) => {
    setLocalSettings({ ...localSettings, chartStyle });
  };
  
  const handleTerminalHeightChange = (height: number[]) => {
    setLocalSettings({ ...localSettings, terminalHeight: height[0] });
  };
  
  const handleSidebarWidthChange = (width: number[]) => {
    setLocalSettings({ ...localSettings, sidebarWidth: width[0] });
  };
  
  const handleAPIKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings({ ...localSettings, apiKey: e.target.value });
  };
  
  const handleWebSocketURLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings({ ...localSettings, wsUrl: e.target.value });
  };
  
  const handleSubscriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings({ ...localSettings, subscription: e.target.value });
  };
  
  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await updateSettings(localSettings);
      toast.success('Settings saved successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetSettings = () => {
    setLocalSettings(DEFAULT_SETTINGS);
    toast.info('Settings reset to default values');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your application preferences
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="appearance" className="mt-5">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="space-y-4 py-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base">Theme</Label>
                <RadioGroup 
                  className="grid grid-cols-2 gap-4 mt-2" 
                  value={localSettings.theme}
                  onValueChange={handleThemeChange}
                >
                  <div>
                    <RadioGroupItem value="light" id="light" className="peer sr-only" />
                    <Label
                      htmlFor="light"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-100 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                      <span className="mt-2 text-xs">Light</span>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                    <Label
                      htmlFor="dark"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-gray-950 text-white p-4 hover:bg-gray-900 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                      <span className="mt-2 text-xs">Dark</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label className="text-base">Accent Color</Label>
                <RadioGroup 
                  className="grid grid-cols-4 gap-2 mt-2" 
                  value={localSettings.accent as string}
                  onValueChange={(value) => handleAccentChange(value as AccentColor)}
                >
                  <div>
                    <RadioGroupItem value="green" id="green" className="peer sr-only" />
                    <Label
                      htmlFor="green"
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted p-1 hover:border-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary aspect-square"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-600"></div>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem value="blue" id="blue" className="peer sr-only" />
                    <Label
                      htmlFor="blue"
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted p-1 hover:border-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary aspect-square"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-600"></div>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem value="purple" id="purple" className="peer sr-only" />
                    <Label
                      htmlFor="purple"
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted p-1 hover:border-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary aspect-square"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-600"></div>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem value="red" id="red" className="peer sr-only" />
                    <Label
                      htmlFor="red"
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted p-1 hover:border-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary aspect-square"
                    >
                      <div className="w-10 h-10 rounded-full bg-red-600"></div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label htmlFor="font">Font</Label>
                <Select 
                  value={localSettings.font as string} 
                  onValueChange={(value) => handleFontChange(value as FontOption)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                    <SelectItem value="Fira Code">Fira Code</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                    <SelectItem value="Consolas">Consolas</SelectItem>
                    <SelectItem value="Menlo">Menlo</SelectItem>
                    <SelectItem value="Monaco">Monaco</SelectItem>
                    <SelectItem value="Roboto Mono">Roboto Mono</SelectItem>
                    <SelectItem value="Source Code Pro">Source Code Pro</SelectItem>
                    <SelectItem value="VT323">VT323 (Pixel)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="chart-style">Default Chart Style</Label>
                <Select 
                  value={localSettings.chartStyle as string} 
                  onValueChange={(value) => handleChartStyleChange(value as ChartStyle)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select chart style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="candlestick">Candlestick</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="api" className="space-y-4 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter your API key"
                  value={localSettings.apiKey}
                  onChange={handleAPIKeyChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  API key for your broker service
                </p>
              </div>
              
              <div>
                <Label htmlFor="ws-url">WebSocket URL</Label>
                <Input
                  id="ws-url"
                  placeholder="wss://example.com/websocket"
                  value={localSettings.wsUrl}
                  onChange={handleWebSocketURLChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  WebSocket endpoint for real-time market data
                </p>
              </div>
              
              <div>
                <Label htmlFor="subscription">Subscription Format</Label>
                <Input
                  id="subscription"
                  placeholder='{"ticks":"R_10"}'
                  value={localSettings.subscription}
                  onChange={handleSubscriptionChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  JSON format for market data subscription
                </p>
              </div>
              
              <div className="rounded-md bg-muted p-4 text-sm">
                <h4 className="font-medium">Connection Status</h4>
                <div className="mt-2 flex items-center">
                  <div className={`h-3 w-3 rounded-full ${localSettings.apiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="ml-2">
                    {localSettings.apiKey ? 'API Key configured' : 'API Key missing'}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">
                    Go to <strong>Debug</strong> section for advanced connection management
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="layout" className="space-y-4 py-4">
            <div className="space-y-4">
              <div>
                <Label className="mb-2">Terminal Height: {localSettings.terminalHeight}px</Label>
                <Slider
                  value={[localSettings.terminalHeight]}
                  min={100}
                  max={500}
                  step={10}
                  onValueChange={handleTerminalHeightChange}
                />
              </div>
              
              <div>
                <Label className="mb-2">Sidebar Width: {localSettings.sidebarWidth}px</Label>
                <Slider
                  value={[localSettings.sidebarWidth]}
                  min={150}
                  max={300}
                  step={10}
                  onValueChange={handleSidebarWidthChange}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="auto-hide-terminal" />
                <Label htmlFor="auto-hide-terminal">Auto-hide Terminal</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="collapse-sidebar-mobile" defaultChecked />
                <Label htmlFor="collapse-sidebar-mobile">Collapse sidebar on mobile</Label>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Data Backups</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically backup your data
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Developer Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable additional debugging tools
                  </p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Anonymous Usage Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Help improve the app by sending anonymous usage data
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div>
                <Button variant="outline" className="w-full" onClick={handleResetSettings}>
                  Reset All Settings
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
