
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Moon, SunMedium, PaletteIcon, Globe, Baseline, LayoutGrid, Code } from "lucide-react";
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/components/ui/theme-provider';

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
  const [sidebarWidth, setSidebarWidth] = useState<number>(settings?.sidebarWidth || 150);
  
  useEffect(() => {
    if (settings) {
      setWsUrl(settings.wsUrl || '');
      setApiKey(settings.apiKey || '');
      setSubscription(settings.subscription || '');
      setSelectedFont(settings.font || 'JetBrains Mono');
      setSelectedAccent(settings.accent || 'green');
      setSelectedChartStyle(settings.chartStyle || 'line');
      setTerminalHeight(settings.terminalHeight || 200);
      setSidebarWidth(settings.sidebarWidth || 150);
    }
  }, [settings]);
  
  const handleSave = () => {
    updateSettings({
      wsUrl,
      apiKey,
      subscription: subscription,
      font: selectedFont as any,
      accent: selectedAccent as any,
      chartStyle: selectedChartStyle as any,
      terminalHeight,
      sidebarWidth
    });
    
    onOpenChange(false);
  };
  
  const handleThemeChange = (value: string) => {
    setTheme(value as any);
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
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="connections">API Connections</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="space-y-4">
            <div className="space-y-4">
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
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    className={`h-10 bg-green-500/20 border-green-500/50 hover:bg-green-500/30 ${selectedAccent === 'green' ? 'ring-2 ring-green-500' : ''}`}
                    onClick={() => setSelectedAccent('green')}
                  >
                    <span className="sr-only">Green</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`h-10 bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30 ${selectedAccent === 'blue' ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setSelectedAccent('blue')}
                  >
                    <span className="sr-only">Blue</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`h-10 bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30 ${selectedAccent === 'purple' ? 'ring-2 ring-purple-500' : ''}`}
                    onClick={() => setSelectedAccent('purple')}
                  >
                    <span className="sr-only">Purple</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`h-10 bg-red-500/20 border-red-500/50 hover:bg-red-500/30 ${selectedAccent === 'red' ? 'ring-2 ring-red-500' : ''}`}
                    onClick={() => setSelectedAccent('red')}
                  >
                    <span className="sr-only">Red</span>
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Font</Label>
                <Select
                  value={selectedFont}
                  onValueChange={(value) => setSelectedFont(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                    <SelectItem value="Fira Code">Fira Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="layout" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Chart Style</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button 
                    variant={selectedChartStyle === "line" ? "default" : "outline"} 
                    onClick={() => setSelectedChartStyle("line")}
                    className="flex flex-col items-center justify-center gap-1 p-2 h-auto"
                  >
                    <LayoutGrid className="h-5 w-5" />
                    <span className="text-xs">Line</span>
                  </Button>
                  <Button 
                    variant={selectedChartStyle === "candlestick" ? "default" : "outline"} 
                    onClick={() => setSelectedChartStyle("candlestick")}
                    className="flex flex-col items-center justify-center gap-1 p-2 h-auto"
                  >
                    <Baseline className="h-5 w-5" />
                    <span className="text-xs">Candlestick</span>
                  </Button>
                  <Button 
                    variant={selectedChartStyle === "bar" ? "default" : "outline"} 
                    onClick={() => setSelectedChartStyle("bar")}
                    className="flex flex-col items-center justify-center gap-1 p-2 h-auto"
                  >
                    <Code className="h-5 w-5" />
                    <span className="text-xs">Bar</span>
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Terminal Height (px)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={100}
                    max={600}
                    value={terminalHeight}
                    onChange={(e) => setTerminalHeight(Number(e.target.value))}
                  />
                  <span className="text-sm text-muted-foreground">px</span>
                </div>
              </div>
              
              <div>
                <Label>Sidebar Width (px)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={100}
                    max={400}
                    value={sidebarWidth}
                    onChange={(e) => setSidebarWidth(Number(e.target.value))}
                  />
                  <span className="text-sm text-muted-foreground">px</span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="connections" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="wsUrl">WebSocket URL</Label>
                <Input
                  id="wsUrl"
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                  placeholder="wss://example.com/ws"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the WebSocket URL for your data provider.
                </p>
              </div>
              
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="API Key"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your API key will be stored securely.
                </p>
              </div>
              
              <div>
                <Label htmlFor="subscription">Subscription JSON</Label>
                <Input
                  id="subscription"
                  value={subscription}
                  onChange={(e) => setSubscription(e.target.value)}
                  placeholder='{"ticks":"R_10"}'
                />
                <p className="text-xs text-muted-foreground mt-1">
                  JSON subscription format for your WebSocket connection.
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
