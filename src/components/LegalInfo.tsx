
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Shield, FileText, Scale, Lock, UserCheck, Info, Copyright } from 'lucide-react';

const LegalInfo: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Legal Information</h2>
          <p className="text-sm text-muted-foreground">Terms, privacy, and intellectual property</p>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Legal Documentation
          </CardTitle>
          <CardDescription>
            Important legal information about your use of NN Ticks
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="terms" className="w-full">
          <div className="px-6 pt-0 pb-2 border-b">
            <TabsList className="w-full bg-transparent mb-0 p-0 h-auto">
              <div className="flex flex-wrap gap-4 w-full">
                <TabsTrigger value="terms" className="h-8 px-3 py-1.5 rounded-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Terms of Service
                </TabsTrigger>
                <TabsTrigger value="privacy" className="h-8 px-3 py-1.5 rounded-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  Privacy Policy
                </TabsTrigger>
                <TabsTrigger value="ip" className="h-8 px-3 py-1.5 rounded-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <Copyright className="h-3.5 w-3.5 mr-1.5" />
                  IP Protection
                </TabsTrigger>
                <TabsTrigger value="disclaimer" className="h-8 px-3 py-1.5 rounded-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <Info className="h-3.5 w-3.5 mr-1.5" />
                  Disclaimer
                </TabsTrigger>
              </div>
            </TabsList>
          </div>
          
          <TabsContent value="terms" className="px-6 py-4 space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Terms of Service</h3>
                <p className="text-sm text-muted-foreground">
                  Last updated: April 1, 2025
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-base font-medium">1. Acceptance of Terms</h4>
                <p className="text-sm">
                  By accessing or using NN Ticks ("the Service"), you agree to be bound by these Terms of Service 
                  and all applicable laws and regulations. If you do not agree with any of these terms, you are 
                  prohibited from using or accessing the Service.
                </p>
                
                <h4 className="text-base font-medium">2. Use License</h4>
                <p className="text-sm">
                  Permission is granted to use the Service for personal, non-commercial transactional purposes only. 
                  This license does not include:
                </p>
                <ul className="list-disc pl-6 text-sm space-y-1">
                  <li>Modifying or copying the software</li>
                  <li>Using the software for commercial purposes</li>
                  <li>Attempting to decompile or reverse engineer the software</li>
                  <li>Removing any copyright or proprietary notations</li>
                  <li>Transferring the software to another person or "mirroring" it</li>
                </ul>
                
                <h4 className="text-base font-medium">3. Disclaimer</h4>
                <p className="text-sm">
                  The Service is provided "as is". NN Ticks makes no warranties, expressed or implied, and hereby 
                  disclaims all warranties, including without limitation implied warranties of merchantability, 
                  fitness for a particular purpose, and non-infringement.
                </p>
                
                <h4 className="text-base font-medium">4. Limitations</h4>
                <p className="text-sm">
                  In no event shall NN Ticks be liable for any damages arising out of the use or inability to use 
                  the Service, even if NN Ticks has been notified of the possibility of such damages.
                </p>
                
                <h4 className="text-base font-medium">5. Revisions</h4>
                <p className="text-sm">
                  NN Ticks may revise these Terms of Service at any time without notice. By using the Service, 
                  you agree to be bound by the current version of these Terms of Service.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="privacy" className="px-6 py-4 space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Privacy Policy</h3>
                <p className="text-sm text-muted-foreground">
                  Last updated: April 1, 2025
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-base font-medium">1. Information Collection</h4>
                <p className="text-sm">
                  We collect information that you provide directly to us when you register for an account, 
                  create or modify your profile, and use the features of our Service. This information may include 
                  your name, email address, and usage data.
                </p>
                
                <h4 className="text-base font-medium">2. Data Storage</h4>
                <p className="text-sm">
                  All user data is stored securely in our Supabase database with appropriate security measures. 
                  Your trading data, neural network configurations, and training epochs are stored to provide 
                  continuity of service.
                </p>
                
                <h4 className="text-base font-medium">3. Use of Information</h4>
                <p className="text-sm">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 text-sm space-y-1">
                  <li>Provide, maintain, and improve our Service</li>
                  <li>Process and complete transactions</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Develop new products and services</li>
                </ul>
                
                <h4 className="text-base font-medium">4. Data Security</h4>
                <p className="text-sm">
                  We take reasonable measures to help protect your personal information from loss, theft, misuse, 
                  unauthorized access, disclosure, alteration, and destruction.
                </p>
                
                <h4 className="text-base font-medium">5. Your Rights</h4>
                <p className="text-sm">
                  You have the right to access, correct, or delete your personal information. You may also object to 
                  or restrict certain processing of your information. To exercise these rights, please contact us.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ip" className="px-6 py-4 space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Intellectual Property Protection</h3>
                <p className="text-sm text-muted-foreground">
                  Last updated: April 1, 2025
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-base font-medium">1. Ownership</h4>
                <p className="text-sm">
                  NN Ticks, including its software, algorithms, neural network implementation, user interface, and 
                  all content, is the exclusive property of NN Ticks Enterprise Analytics and is protected by 
                  copyright, trademark, and other intellectual property laws.
                </p>
                
                <h4 className="text-base font-medium">2. Neural Network Algorithms</h4>
                <p className="text-sm">
                  The neural network algorithms, training methodologies, and prediction systems used in NN Ticks 
                  are proprietary and protected by both copyright and patent laws. Unauthorized reproduction, 
                  distribution, or use is strictly prohibited.
                </p>
                
                <h4 className="text-base font-medium">3. User Content</h4>
                <p className="text-sm">
                  While you retain ownership of your data, you grant NN Ticks a license to use, store, and process 
                  this information to provide and improve the Service. NN Ticks does not claim ownership of your 
                  trading strategies or personal configuration settings.
                </p>
                
                <h4 className="text-base font-medium">4. Distribution Restrictions</h4>
                <p className="text-sm">
                  The NN Ticks software must not be distributed, shared, or resold under any circumstances. 
                  Each license is granted for a single user only. Multi-user licenses must be obtained directly 
                  from NN Ticks Enterprise Analytics.
                </p>
                
                <h4 className="text-base font-medium">5. Enforcement</h4>
                <p className="text-sm">
                  NN Ticks Enterprise Analytics actively enforces its intellectual property rights to the fullest 
                  extent of the law. Violations may result in termination of service, legal action, and monetary damages.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="disclaimer" className="px-6 py-4 space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Risk Disclaimer</h3>
                <p className="text-sm text-muted-foreground">
                  Last updated: April 1, 2025
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-base font-medium">1. Trading Risks</h4>
                <p className="text-sm">
                  Trading in financial markets involves significant risk. Past performance is not indicative of 
                  future results. The neural network predictions provided by NN Ticks are for informational 
                  purposes only and should not be considered as financial advice.
                </p>
                
                <h4 className="text-base font-medium">2. Neural Network Limitations</h4>
                <p className="text-sm">
                  Neural networks, by their nature, have limitations in predicting financial markets. The accuracy 
                  of predictions depends on training data, market conditions, and many other factors. No prediction 
                  system can guarantee profits or accurately predict market movements all the time.
                </p>
                
                <h4 className="text-base font-medium">3. Not Investment Advice</h4>
                <p className="text-sm">
                  NN Ticks does not provide investment advice. The information and predictions provided should be 
                  considered as one of many tools for decision-making. Users should consult with a qualified 
                  financial advisor before making investment decisions.
                </p>
                
                <h4 className="text-base font-medium">4. User Responsibility</h4>
                <p className="text-sm">
                  Users are solely responsible for their trading decisions. NN Ticks and its creators accept no 
                  liability for any loss or damage, including without limitation financial loss, which may be 
                  incurred as a result of using the Service.
                </p>
                
                <h4 className="text-base font-medium">5. Demo vs. Real Trading</h4>
                <p className="text-sm">
                  Results achieved in demo or simulation environments may not be representative of results in 
                  real trading conditions. Factors like slippage, liquidity, and execution speed can significantly 
                  affect real trading outcomes.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <CardFooter className="border-t py-3 text-xs text-muted-foreground flex justify-between">
          <div>© 2025 NN Ticks Enterprise Analytics. All rights reserved.</div>
          <div className="flex items-center gap-1">
            <Scale className="h-3 w-3" /> Legal version 2.0
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LegalInfo;
