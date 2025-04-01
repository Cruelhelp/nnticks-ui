
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings, UserSettings } from "@/hooks/useSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { settings, updateSettings } = useSettings();
  const { userDetails } = useAuth();
  const isPro = userDetails?.proStatus || false;
  
  const [tempSettings, setTempSettings] = useState<UserSettings>({ ...settings });
  const [showTerminal, setShowTerminal] = useState(true);
  
  // Update tempSettings when settings change
  useEffect(() => {
    setTempSettings({ ...settings });
  }, [settings, open]);
  
  const handleSave = () => {
    updateSettings(tempSettings);
    toast.success("Settings saved successfully");
    onOpenChange(false);
    
    // Apply theme changes immediately
    applySettings(tempSettings);
  };
  
  const applySettings = (newSettings: UserSettings) => {
    // Apply accent color
    const body = document.body;
    body.classList.remove('theme-blue', 'theme-purple', 'theme-red');
    
    if (newSettings.accent !== 'green') {
      body.classList.add(`theme-${newSettings.accent}`);
    }
    
    // Apply font
    document.documentElement.style.fontFamily = newSettings.font;
  };
  
  // Show preview of settings changes
  useEffect(() => {
    if (open) {
      // Apply temporary settings for preview
      applySettings(tempSettings);
      
      // Revert to original settings when dialog closes
      return () => {
        applySettings(settings);
      };
    }
  }, [tempSettings, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="appearance">
          <TabsList>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="neural-network" disabled={!isPro}>Neural Network {!isPro && "(Pro)"}</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['green', 'blue', 'purple', 'red'] as const).map(color => (
                    <div 
                      key={color}
                      className={`
                        h-10 rounded-md cursor-pointer border-2 transition-all
                        ${tempSettings.accent === color ? 'ring-2 ring-offset-2 ring-primary' : ''}
                      `}
                      style={{ backgroundColor: `var(--${color}-500)` }}
                      onClick={() => setTempSettings({...tempSettings, accent: color})}
                    />
                  ))}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  {(['green', 'blue', 'purple', 'red'] as const).map(color => (
                    <div key={color} className="flex items-center space-x-1">
                      <RadioGroupItem 
                        value={color} 
                        id={color} 
                        checked={tempSettings.accent === color}
                        onClick={() => setTempSettings({...tempSettings, accent: color})}
                      />
                      <Label htmlFor={color} className="capitalize">{color}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Font</Label>
                <RadioGroup 
                  value={tempSettings.font} 
                  onValueChange={(value) => setTempSettings({...tempSettings, font: value as UserSettings['font']})}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="JetBrains Mono" id="jetbrains" />
                    <Label htmlFor="jetbrains" style={{ fontFamily: 'JetBrains Mono' }}>JetBrains Mono</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Fira Code" id="fira" />
                    <Label htmlFor="fira" style={{ fontFamily: 'Fira Code' }}>Fira Code</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <div className="space-y-2 pt-4">
              <Label>Chart Style</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['line', 'candlestick', 'bar'] as const).map(style => (
                  <div 
                    key={style}
                    className={`
                      border rounded-md p-4 cursor-pointer transition-all
                      ${tempSettings.chartStyle === style ? 'ring-2 ring-primary bg-accent' : 'bg-card'}
                    `}
                    onClick={() => setTempSettings({...tempSettings, chartStyle: style})}
                  >
                    <div className="h-16 flex items-center justify-center">
                      {style === 'line' && (
                        <svg className="w-full h-full" viewBox="0 0 100 50">
                          <path d="M0,25 C20,10 40,40 60,20 S80,30 100,15" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" />
                        </svg>
                      )}
                      {style === 'candlestick' && (
                        <svg className="w-full h-full" viewBox="0 0 100 50">
                          <line x1="10" y1="10" x2="10" y2="40" stroke="currentColor" />
                          <rect x="5" y="15" width="10" height="15" fill="var(--green-500)" />
                          
                          <line x1="30" y1="5" x2="30" y2="45" stroke="currentColor" />
                          <rect x="25" y="20" width="10" height="15" fill="var(--red-500)" />
                          
                          <line x1="50" y1="15" x2="50" y2="35" stroke="currentColor" />
                          <rect x="45" y="18" width="10" height="10" fill="var(--green-500)" />
                          
                          <line x1="70" y1="10" x2="70" y2="40" stroke="currentColor" />
                          <rect x="65" y="15" width="10" height="20" fill="var(--red-500)" />
                          
                          <line x1="90" y1="20" x2="90" y2="30" stroke="currentColor" />
                          <rect x="85" y="22" width="10" height="6" fill="var(--green-500)" />
                        </svg>
                      )}
                      {style === 'bar' && (
                        <svg className="w-full h-full" viewBox="0 0 100 50">
                          <rect x="5" y="10" width="10" height="30" fill="var(--green-500)" />
                          <rect x="25" y="20" width="10" height="20" fill="var(--red-500)" />
                          <rect x="45" y="15" width="10" height="25" fill="var(--green-500)" />
                          <rect x="65" y="25" width="10" height="15" fill="var(--red-500)" />
                          <rect x="85" y="5" width="10" height="35" fill="var(--green-500)" />
                        </svg>
                      )}
                    </div>
                    <div className="text-center mt-2 capitalize">{style}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="layout" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Show Terminal by Default</Label>
                <Switch 
                  checked={showTerminal} 
                  onCheckedChange={setShowTerminal}
                />
              </div>
            </div>
          
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Terminal Height ({tempSettings.terminalHeight}px)</Label>
              </div>
              <Slider 
                min={100} 
                max={400}
                step={10}
                value={[tempSettings.terminalHeight]} 
                onValueChange={(value) => setTempSettings({...tempSettings, terminalHeight: value[0]})}
              />
              <div className="h-24 border border-dashed border-muted-foreground rounded-md p-2 relative">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-muted"
                  style={{ height: `${tempSettings.terminalHeight / 4}px` }}
                >
                  <div className="p-2 text-xs text-muted-foreground">Terminal preview</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Sidebar Width ({tempSettings.sidebarWidth}px)</Label>
              </div>
              <Slider 
                min={100} 
                max={300}
                step={10}
                value={[tempSettings.sidebarWidth]} 
                onValueChange={(value) => setTempSettings({...tempSettings, sidebarWidth: value[0]})}
              />
              <div className="h-24 border border-dashed border-muted-foreground rounded-md p-2 relative">
                <div 
                  className="absolute top-0 bottom-0 left-0 bg-muted"
                  style={{ width: `${tempSettings.sidebarWidth / 4}px` }}
                >
                  <div className="p-2 text-xs text-muted-foreground">Sidebar</div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="neural-network" className="space-y-4 mt-4">
            {isPro ? (
              <>
                <div className="space-y-2">
                  <Label>Learning Rate</Label>
                  <Slider min={1} max={100} step={1} value={[1]} />
                </div>
                <div className="space-y-2">
                  <Label>Epochs</Label>
                  <Slider min={10} max={100} step={5} value={[50]} />
                </div>
                <div className="space-y-2">
                  <Label>Layers</Label>
                  <Input type="number" min={1} max={5} defaultValue={3} />
                </div>
                <div className="space-y-2">
                  <Label>Nodes per layer</Label>
                  <Input type="number" min={16} max={256} step={16} defaultValue={64} />
                </div>
              </>
            ) : (
              <div className="p-4 border border-border rounded-md bg-card text-center">
                <h3 className="font-medium">Pro Feature</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upgrade to Pro to customize neural network parameters
                </p>
                <Button className="mt-4" variant="default">Upgrade to Pro</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="subscription" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="p-4 border border-border rounded-md bg-card">
                <h3 className="font-medium">Current Plan</h3>
                <p className="text-xl font-bold mt-1">{isPro ? 'Pro' : 'Free'}</p>
                {isPro && (
                  <p className="text-sm text-muted-foreground">
                    Next billing date: 01/01/2026
                  </p>
                )}
              </div>
              
              {!isPro && (
                <div className="p-4 border border-border rounded-md bg-card">
                  <h3 className="font-medium">Upgrade to Pro</h3>
                  <ul className="text-sm mt-2 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Advanced neural network customization
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Full indicator set
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Access to all 20 training missions
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Model sharing
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Leaderboard access
                    </li>
                  </ul>
                  <Button className="w-full mt-4" variant="default">
                    Subscribe - $10/month
                  </Button>
                </div>
              )}
              
              <div className="text-center text-sm text-muted-foreground">
                Payment processing by PayPal and Stripe
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
