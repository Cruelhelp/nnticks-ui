
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LegalInfoProps {
  trigger?: React.ReactNode;
}

const LegalInfo: React.FC<LegalInfoProps> = ({ trigger }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || <Button variant="link" className="text-xs text-muted-foreground">Legal Information</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Legal Information</DialogTitle>
          <DialogDescription>
            Important legal information about NNticks
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="terms">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="terms">Terms of Service</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
            <TabsTrigger value="disclaimer">Risk Disclaimer</TabsTrigger>
          </TabsList>
          
          <TabsContent value="terms" className="max-h-[500px] overflow-y-auto">
            <div className="space-y-4 text-sm">
              <h3 className="font-bold text-lg">Terms of Service</h3>
              <p className="text-muted-foreground">Last Updated: July 15, 2025</p>
              
              <div className="space-y-4">
                <p>
                  Welcome to NNticks. Please read these Terms of Service carefully before using our services.
                </p>
                
                <h4 className="font-semibold">1. Acceptance of Terms</h4>
                <p>
                  By accessing or using NNticks, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                </p>
                
                <h4 className="font-semibold">2. Use License</h4>
                <p>
                  Permission is granted to use NNticks for personal, non-commercial purposes. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc ml-6">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose</li>
                  <li>Attempt to decompile or reverse engineer any software contained in NNticks</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                  <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                </ul>
                
                <h4 className="font-semibold">3. Subscription and Payment</h4>
                <p>
                  Pro memberships are charged at $10 USD per month. Payments are processed through secure third-party payment processors. By subscribing to a Pro membership, you authorize us to charge the payment method provided on a recurring monthly basis until you cancel.
                </p>
                
                <h4 className="font-semibold">4. Disclaimer</h4>
                <p>
                  NNticks is provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </p>
                
                <h4 className="font-semibold">5. Trading Risk</h4>
                <p>
                  Trading financial instruments carries a high level of risk and may not be suitable for all investors. Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite. The possibility exists that you could sustain a loss of some or all of your initial investment and therefore you should not invest money that you cannot afford to lose.
                </p>
                
                <h4 className="font-semibold">6. Limitations</h4>
                <p>
                  In no event shall NNticks or its suppliers be liable for any damages arising out of the use or inability to use NNticks, even if we have been notified orally or in writing of the possibility of such damage.
                </p>
                
                <h4 className="font-semibold">7. Governing Law</h4>
                <p>
                  These terms and conditions are governed by and construed in accordance with the laws of the United States and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="privacy" className="max-h-[500px] overflow-y-auto">
            <div className="space-y-4 text-sm">
              <h3 className="font-bold text-lg">Privacy Policy</h3>
              <p className="text-muted-foreground">Last Updated: July 15, 2025</p>
              
              <div className="space-y-4">
                <p>
                  Your privacy is important to us. It is NNticks' policy to respect your privacy regarding any information we may collect from you across our website and other services we own and operate.
                </p>
                
                <h4 className="font-semibold">1. Information We Collect</h4>
                <p>
                  We collect personal information when you:
                </p>
                <ul className="list-disc ml-6">
                  <li>Create an account (email address, username)</li>
                  <li>Make payments (billing information)</li>
                  <li>Use our services (trading history, preferences)</li>
                  <li>Communicate with us directly</li>
                </ul>
                
                <h4 className="font-semibold">2. How We Use Your Information</h4>
                <p>
                  We use the information we collect in various ways, including to:
                </p>
                <ul className="list-disc ml-6">
                  <li>Provide, operate, and maintain our services</li>
                  <li>Improve, personalize, and expand our services</li>
                  <li>Understand and analyze how you use our services</li>
                  <li>Develop new products, services, features, and functionality</li>
                  <li>Process payments and prevent fraudulent transactions</li>
                </ul>
                
                <h4 className="font-semibold">3. Data Security</h4>
                <p>
                  We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage.
                </p>
                
                <h4 className="font-semibold">4. Third-Party Services</h4>
                <p>
                  We may employ third-party companies and individuals due to the following reasons:
                </p>
                <ul className="list-disc ml-6">
                  <li>To facilitate our Service;</li>
                  <li>To provide the Service on our behalf;</li>
                  <li>To perform Service-related services; or</li>
                  <li>To assist us in analyzing how our Service is used.</li>
                </ul>
                <p>
                  These third parties have access to your Personal Information only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                </p>
                
                <h4 className="font-semibold">5. Your Rights</h4>
                <p>
                  You have the right to:
                </p>
                <ul className="list-disc ml-6">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to our use of your data</li>
                  <li>Request transfer of your data</li>
                </ul>
                
                <h4 className="font-semibold">6. Cookies</h4>
                <p>
                  We use cookies and similar technologies to track activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                </p>
                
                <h4 className="font-semibold">7. Contact Us</h4>
                <p>
                  If you have any questions about our Privacy Policy, please contact us at privacy@nnticks.com.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="disclaimer" className="max-h-[500px] overflow-y-auto">
            <div className="space-y-4 text-sm">
              <h3 className="font-bold text-lg">Risk Disclaimer</h3>
              <p className="text-muted-foreground">Last Updated: July 15, 2025</p>
              
              <div className="space-y-4">
                <p className="font-medium text-red-500">
                  Trading financial instruments involves significant risk and is not suitable for all investors.
                </p>
                
                <h4 className="font-semibold">1. Financial Risk</h4>
                <p>
                  Trading financial instruments, including but not limited to forex, cryptocurrencies, stocks, options, and futures carries a high level of risk, and may not be suitable for all investors. Before deciding to trade any financial instruments, you should carefully consider your investment objectives, level of experience, and risk appetite. The possibility exists that you could sustain a loss of some or all of your initial investment and therefore you should not invest money that you cannot afford to lose.
                </p>
                
                <h4 className="font-semibold">2. No Investment Advice</h4>
                <p>
                  NNticks does not provide investment advice, tax advice, legal advice, or other professional advice. The information provided by NNticks, including predictions, analyses, and signals, is for informational and educational purposes only. It should not be considered as investment advice or a recommendation to buy, sell, or hold any investment or financial product.
                </p>
                
                <h4 className="font-semibold">3. Past Performance</h4>
                <p>
                  Past performance is not indicative of future results. The results displayed or discussed on NNticks may represent back-tested performance and simulated results. These results have inherent limitations as they are achieved with the benefit of hindsight. Actual performance may differ significantly from simulated or back-tested results.
                </p>
                
                <h4 className="font-semibold">4. Neural Network Limitations</h4>
                <p>
                  Neural networks and artificial intelligence tools are based on historical data and mathematical models. Financial markets are influenced by many factors that cannot be predicted by any algorithm, including but not limited to global events, political decisions, and market sentiment. No prediction system, regardless of sophistication, can guarantee accurate predictions of future market movements.
                </p>
                
                <h4 className="font-semibold">5. Technical Issues</h4>
                <p>
                  Trading platforms, including NNticks, may experience technical issues such as connectivity problems, data errors, or system failures. These technical issues may affect your ability to execute trades or receive accurate information, potentially resulting in financial losses.
                </p>
                
                <h4 className="font-semibold">6. Educational Purpose</h4>
                <p>
                  NNticks should be considered primarily as an educational tool to understand trading patterns and develop trading strategies. Users should not rely solely on NNticks for making investment decisions.
                </p>
                
                <h4 className="font-semibold">7. User Responsibility</h4>
                <p>
                  By using NNticks, you acknowledge and agree that you are solely responsible for your investment decisions and the resulting consequences. You should conduct your own research and consult with a qualified financial advisor before making any investment decisions.
                </p>
                
                <p className="font-medium">
                  If you do not agree with or understand this risk disclaimer, you should not use NNticks.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LegalInfo;
