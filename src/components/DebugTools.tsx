
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast"
import { webSocketService } from '@/services/WebSocketService';
import { useSettings } from '@/hooks/useSettings';
import { Textarea } from '@/components/ui/textarea';

const DebugTools: React.FC = () => {
  const [wsUrl, setWsUrl] = useState('');
  const [customWsUrl, setCustomWsUrl] = useState('');
  const { toast } = useToast();
  const { settings, updateSettings } = useSettings();
  
  useEffect(() => {
    // Use the public getter for config
    setWsUrl(webSocketService.config.url);
  }, []);
  
  const handleApplySettings = () => {
    // Update WebSocket URL
    if (customWsUrl) {
      webSocketService.updateConfig({ url: customWsUrl });
      setWsUrl(customWsUrl);
      setCustomWsUrl('');
    }
    
    // Update subscription
    try {
      if (settings?.subscription) {
        const parsedSubscription = JSON.parse(settings.subscription);
        webSocketService.updateConfig({ subscription: parsedSubscription });
      }
    } catch (error) {
      console.error("Error parsing subscription:", error);
      toast({
        title: "Error",
        description: "Failed to parse subscription. Please check the format.",
      });
      return;
    }
    
    toast({
      title: "Success",
      description: "Settings applied successfully.",
    });
  };
  
  const handleSubscriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (settings) {
      updateSettings({ ...settings, subscription: e.target.value });
    }
  };
  
  const handleResetSettings = () => {
    // Reset to defaults using the WebSocketService directly
    webSocketService.updateConfig({
      url: "wss://ws.binaryws.com/websockets/v3?app_id=1089",
      apiKey: "nPAKsP8mJBuLkvW",
      subscription: { ticks: 'R_10' }
    });
    
    setWsUrl(webSocketService.config.url);
    if (settings) {
      updateSettings({ ...settings, subscription: JSON.stringify({ ticks: 'R_10' }, null, 2) });
    }
    
    toast({
      title: "Settings Reset",
      description: "Settings have been reset to default values.",
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Tools</CardTitle>
        <CardDescription>
          Advanced tools for debugging and testing WebSocket connections.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="ws-url">WebSocket URL</Label>
          <Input
            id="ws-url"
            value={wsUrl}
            disabled
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="custom-ws-url">Custom WebSocket URL</Label>
          <Input
            id="custom-ws-url"
            placeholder="wss://example.com/ws"
            value={customWsUrl}
            onChange={(e) => setCustomWsUrl(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="subscription">Custom Subscription</Label>
          <Textarea
            id="subscription"
            className="font-mono text-sm"
            placeholder='{ "ticks": "R_100" }'
            value={settings?.subscription || ''}
            onChange={handleSubscriptionChange}
            rows={4}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={handleResetSettings}>
          Reset Settings
        </Button>
        <Button size="sm" onClick={handleApplySettings}>
          Apply Settings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DebugTools;
