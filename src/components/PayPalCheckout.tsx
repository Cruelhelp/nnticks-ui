
import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface PayPalCheckoutProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({ onSuccess, onError }) => {
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, userDetails, updateUserDetails } = useAuth();

  const initialOptions = {
    clientId: "AQJc87I4AEuM_c9OOfqKBhLHtqeM6wF61YqvGta59_5WNtdWu1pyVBRMU0VtgRLlk3y9qNMWfPem2-CU",
    currency: "USD",
    intent: "capture",
  };

  const handleCreateOrder = async () => {
    setIsProcessing(true);
    try {
      // In a real application, this would be an API call to your backend
      // For demo purposes, we're creating the order on the client side
      const orderData = {
        purchase_units: [
          {
            description: "NNticks Pro Subscription",
            amount: {
              currency_code: "USD",
              value: "49.99",
            },
          },
        ],
        application_context: {
          shipping_preference: "NO_SHIPPING",
        }
      };

      return "PLACEHOLDER_ORDER_ID"; // In real implementation, return the order ID from your server
    } catch (error) {
      console.error("Error creating order:", error);
      setMessage("Could not initiate PayPal Checkout...");
      setIsProcessing(false);
      if (onError) onError(error);
      return null;
    }
  };

  const handleApprove = async (data: any) => {
    try {
      setMessage("Payment processing...");
      
      // In a real app, you'd have a server endpoint to capture the payment
      // For demo, we'll simulate a successful capture
      
      // Update user to Pro status
      if (user) {
        await updateUserDetails({ proStatus: true });
        
        // Create a payment record in Supabase
        await supabase.from('payments').insert({
          user_id: user.id,
          amount: 49.99,
          currency: 'USD',
          payment_method: 'paypal',
          status: 'completed',
          order_id: data.orderID,
          description: 'NNticks Pro Subscription'
        });
      }
      
      setMessage("Payment successful! You've been upgraded to Pro!");
      toast.success("You've been upgraded to Pro status!");
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error processing payment:", error);
      setMessage(`Payment processing error: ${error}`);
      if (onError) onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Render content based on current Pro status
  if (userDetails?.proStatus) {
    return (
      <Card className="bg-gradient-to-br from-black to-slate-900 border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="text-yellow-500 mr-2" />
            You're already a Pro Member!
          </CardTitle>
          <CardDescription>
            Enjoy all the premium features NNticks has to offer.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black to-slate-900 opacity-50 z-0"></div>
      <CardHeader className="relative z-10 pb-0">
        <Badge variant="outline" className="absolute top-4 right-4 bg-yellow-500/10 text-yellow-500 border-yellow-500/50">
          Best Value
        </Badge>
        <CardTitle className="text-xl font-bold">Upgrade to NNticks Pro</CardTitle>
        <CardDescription>
          Unlock premium features and enhance your trading experience
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 pt-4">
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-2">
            <Check className="text-primary mt-1 h-4 w-4 flex-shrink-0" />
            <p className="text-sm">Advanced neural network models with higher accuracy</p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="text-primary mt-1 h-4 w-4 flex-shrink-0" />
            <p className="text-sm">Unlimited predictions and training sessions</p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="text-primary mt-1 h-4 w-4 flex-shrink-0" />
            <p className="text-sm">Real-time market data with zero latency</p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="text-primary mt-1 h-4 w-4 flex-shrink-0" />
            <p className="text-sm">Priority support and exclusive features</p>
          </div>
          <div className="flex items-center justify-center mt-4 mb-2">
            <p className="text-3xl font-bold">$49.99</p>
            <span className="text-sm text-muted-foreground ml-1">/month</span>
          </div>
        </div>
        
        <div className="w-full">
          <PayPalScriptProvider options={initialOptions}>
            <PayPalButtons
              style={{ 
                shape: "rect",
                layout: "vertical",
                color: "gold",
                label: "pay"
              }}
              disabled={isProcessing}
              forceReRender={[initialOptions.currency]}
              fundingSource={undefined}
              createOrder={handleCreateOrder}
              onApprove={handleApprove}
              onError={(err) => {
                setMessage(`Error: ${err}`);
                console.error(err);
                if (onError) onError(err);
              }}
            />
          </PayPalScriptProvider>
          
          {message && (
            <div className="mt-4 text-center text-sm">
              {message}
            </div>
          )}
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-4">
          By upgrading, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>
        </p>
      </CardContent>
    </Card>
  );
};

export default PayPalCheckout;
