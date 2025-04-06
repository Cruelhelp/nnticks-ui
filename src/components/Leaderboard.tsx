
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';

// Simple redirect component that will redirect users to the training page
const Leaderboard = () => {
  const navigate = useNavigate();

  // Use useEffect to trigger navigation after component mounts
  React.useEffect(() => {
    const redirectEvent = new CustomEvent('navigate-section', { detail: 'training' });
    document.dispatchEvent(redirectEvent);
  }, []);

  return (
    <div className="flex items-center justify-center h-full animate-fade-in">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>Redirecting to Training</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <Brain className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="mb-6">The leaderboard feature has been integrated into the Training page.</p>
          <Button 
            onClick={() => {
              const event = new CustomEvent('navigate-section', { detail: 'training' });
              document.dispatchEvent(event);
            }}
          >
            Go to Training
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
