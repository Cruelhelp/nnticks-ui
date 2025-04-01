
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Moon, SunMedium, PaletteIcon, Globe, Baseline, LayoutGrid, Code } from "lucide-react";
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from 'next-themes';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  const { settings, updateSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  
  const [wsUrl, setWsUrl] = useState<string>(settings?.wsUrl || '');
  const [apiKey, setApiKey] = useState<string>(settings?.apiKey || '');
  const [subscription, setSubscription] = useState<string>(settings?.subscription || '');
  const [selectedFont, setSelectedFont] = useState<string>(settings?.font || 'JetBrains Mono');
  const [selectedAccent, setSelectedAccent] = useState<string>(settings?.accent || 'green');
  const [selectedChartStyle, setSelectedChartStyle] = useState<string>(settings?.chartStyle || 'line');
  const [terminalHeight, setTerminalHeight] = useState<number>(settings?.terminalHeight || 200);
  const [sidebarWidth, setSidebarWidth] = useState<number>(settings?.sidebarWidth || 200);
  
  useEffect(() => {
    if (settings) {
      setWsUrl(settings.wsUrl || 'wss://ws.binaryws.com/websockets/v3?app_id=1089');
      setApiKey(settings.apiKey || '');
      setSubscription(settings.subscription || '{"ticks":"R_10"}');
      setSelectedFont(settings.font || 'JetBrains Mono');
      setSelectedAccent(settings.accent || 'green');
      setSelectedChartStyle(settings.chartStyle || 'line');
      setTerminalHeight(settings.terminalHeight || 200);
      setSidebarWidth(settings.sidebarWidth || 200);
    }
  }, [settings]);
  
  const handleSave = () => {
    updateSettings({
      wsUrl,
      apiKey,
      subscription,
      font: selectedFont,
      accent: selectedAccent,
      chartStyle: selectedChartStyle,
      terminalHeight,
      sidebarWidth
    });
    
    // Apply theme
    if (theme !== 'dark' && theme !== 'light') {
      setTheme('dark');
    }
    
    // Show confirmation toast
    toast.success("Settings saved successfully!");
    onOpenChange(false);
  };
  
  const handleThemeChange = (value: string) => {
    setTheme(value);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your experience and preferences.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="appearance">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="connections">API Connections</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="space-y-4">
            <div>
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button 
                  variant={theme === "light" ? "default" : "outline"} 
                  onClick={() => handleThemeChange("light")}
                  className="flex flex-col items-center justify-center gap-1 p-2 h-auto"
                >
                  <SunMedium className="h-5 w-5" />
                  <span className="text-xs">Light</span>
                </Button>
                <Button 
                  variant={theme === "dark" ? "default" : "outline"} 
                  onClick={() => handleThemeChange("dark")}
                  className="flex flex-col items-center justify-center gap-1 p-2 h-auto"
                >
                  <Moon className="h-5 w-5" />
                  <span className="text-xs">Dark</span>
                </Button>
                <Button 
                  variant={theme === "system" ? "default" : "outline"} 
                  onClick={() => handleThemeChange("system")}
                  className="flex flex-col items-center justify-center gap-1 p-2 h-auto"
                >
                  <Monitor className="h-5 w-5" />
                  <span className="text-xs">System</span>
                </Button>
              </div>
            </div>
            
            <div>
              <Label>Accent Color</Label>
              <RadioGroup 
                value={selectedAccent}
                onValueChange={setSelectedAccent}
                className="grid grid-cols-4 gap-2 mt-2"
              >
                <div>
                  <RadioGroupItem value="green" id="green" className="peer sr-only" />
                  <Label
                    htmlFor="green"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-2 hover:border-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-500"></div>
                    <span className="mt-1 text-xs">Green</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem value="blue" id="blue" className="peer sr-only" />
                  <Label
                    htmlFor="blue"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-2 hover:border-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500"></div>
                    <span className="mt-1 text-xs">Blue</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem value="purple" id="purple" className="peer sr-only" />
                  <Label
                    htmlFor="purple"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-2 hover:border-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500"></div>
                    <span className="mt-1 text-xs">Purple</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem value="red" id="red" className="peer sr-only" />
                  <Label
                    htmlFor="red"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-2 hover:border-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-500"></div>
                    <span className="mt-1 text-xs">Red</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="font">Font</Label>
              <Select
                value={selectedFont}
                onValueChange={setSelectedFont}
              >
                <SelectTrigger className="w-full">
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
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="layout" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Chart Style</Label>
                <Select
                  value={selectedChartStyle}
                  onValueChange={setSelectedChartStyle}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select chart style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="candlestick">Candlestick</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="mb-2">Terminal Height: {terminalHeight}px</Label>
                <Slider
                  value={[terminalHeight]}
                  min={100}
                  max={500}
                  step={10}
                  onValueChange={(value) => setTerminalHeight(value[0])}
                />
              </div>
              
              <div>
                <Label className="mb-2">Sidebar Width: {sidebarWidth}px</Label>
                <Slider
                  value={[sidebarWidth]}
                  min={150}
                  max={300}
                  step={10}
                  onValueChange={(value) => setSidebarWidth(value[0])}
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
          
          <TabsContent value="connections" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your API key will be stored securely.
                </p>
              </div>
              
              <div>
                <Label htmlFor="wsUrl">WebSocket URL</Label>
                <Input
                  id="wsUrl"
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                  placeholder="wss://ws.binaryws.com/websockets/v3?app_id=1089"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  WebSocket endpoint for real-time market data
                </p>
              </div>
              
              <div>
                <Label htmlFor="subscription">Subscription Format</Label>
                <Input
                  id="subscription"
                  value={subscription}
                  onChange={(e) => setSubscription(e.target.value)}
                  placeholder='{"ticks":"R_10"}'
                />
                <p className="text-xs text-muted-foreground mt-1">
                  JSON subscription format for your WebSocket connection
                </p>
              </div>
              
              <div className="bg-muted p-3 rounded-md">
                <h4 className="text-sm font-medium mb-1">Sample Formats</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="font-mono">{"Deriv: {\"ticks\":\"R_10\"}"}</p>
                    <p className="font-mono">{"IQ Option: {\"symbol\":\"EURUSD\"}"}</p>
                  </div>
                  <div>
                    <p className="font-mono">{"Binance: {\"method\":\"SUBSCRIBE\"}"}</p>
                    <p className="font-mono">{"Binary: {\"ticks\":\"V_75\"}"}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
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
                <Button variant="outline" className="w-full" onClick={() => {
                  setWsUrl('wss://ws.binaryws.com/websockets/v3?app_id=1089');
                  setApiKey('');
                  setSubscription('{"ticks":"R_10"}');
                  setSelectedFont('JetBrains Mono');
                  setSelectedAccent('green');
                  setSelectedChartStyle('line');
                  setTerminalHeight(200);
                  setSidebarWidth(200);
                }}>
                  Reset All Settings
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
