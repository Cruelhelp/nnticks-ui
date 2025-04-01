
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
import { useState } from "react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { settings, updateSettings } = useSettings();
  const { userDetails } = useAuth();
  const isPro = userDetails?.proStatus || false;
  
  const [tempSettings, setTempSettings] = useState<UserSettings>({ ...settings });
  
  const handleSave = () => {
    updateSettings(tempSettings);
    onOpenChange(false);
  };

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
                <RadioGroup 
                  value={tempSettings.accent} 
                  onValueChange={(value) => setTempSettings({...tempSettings, accent: value as UserSettings['accent']})}
                  className="flex space-x-2"
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="green" id="green" className="bg-green-500" />
                    <Label htmlFor="green">Green</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="blue" id="blue" className="bg-blue-500" />
                    <Label htmlFor="blue">Blue</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="purple" id="purple" className="bg-purple-500" />
                    <Label htmlFor="purple">Purple</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="red" id="red" className="bg-red-500" />
                    <Label htmlFor="red">Red</Label>
                  </div>
                </RadioGroup>
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
            
            <div className="space-y-2">
              <Label>Chart Style</Label>
              <RadioGroup 
                value={tempSettings.chartStyle} 
                onValueChange={(value) => setTempSettings({...tempSettings, chartStyle: value as UserSettings['chartStyle']})}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="line" id="line" />
                  <Label htmlFor="line">Line</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="candlestick" id="candlestick" />
                  <Label htmlFor="candlestick">Candlestick</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bar" id="bar" />
                  <Label htmlFor="bar">Bar</Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>
          
          <TabsContent value="layout" className="space-y-4 mt-4">
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
            </div>
          </TabsContent>
          
          <TabsContent value="neural-network" className="space-y-4 mt-4">
            {isPro ? (
              <>
                <div className="space-y-2">
                  <Label>Learning Rate</Label>
                  <Slider disabled={!isPro} min={1} max={100} step={1} value={[1]} />
                </div>
                <div className="space-y-2">
                  <Label>Epochs</Label>
                  <Slider disabled={!isPro} min={10} max={100} step={5} value={[50]} />
                </div>
                <div className="space-y-2">
                  <Label>Layers</Label>
                  <Input type="number" min={1} max={5} defaultValue={3} disabled={!isPro} />
                </div>
                <div className="space-y-2">
                  <Label>Nodes per layer</Label>
                  <Input type="number" min={16} max={256} step={16} defaultValue={64} disabled={!isPro} />
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
