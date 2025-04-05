
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const LegalInfo: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Legal Information</h2>
        <p className="text-sm text-muted-foreground">Terms of service, privacy policy, and license information</p>
      </div>
      
      <Tabs defaultValue="terms">
        <TabsList className="mb-4">
          <TabsTrigger value="terms">Terms of Service</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          <TabsTrigger value="license">License</TabsTrigger>
          <TabsTrigger value="disclaimer">Disclaimer</TabsTrigger>
        </TabsList>
        
        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <CardTitle>Terms of Service</CardTitle>
              <CardDescription>Last updated: April 5, 2025</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <h3 className="text-lg font-medium">1. Terms</h3>
              <p>
                By accessing this application, you are agreeing to be bound by these Terms of Service,
                all applicable laws and regulations, and agree that you are responsible for compliance with any
                applicable local laws. If you do not agree with any of these terms, you are prohibited from
                using or accessing this application.
              </p>
              
              <h3 className="text-lg font-medium">2. Use License</h3>
              <p>
                Permission is granted to temporarily use this application for personal, non-commercial purposes only.
                This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Modify or copy the materials;</li>
                <li>Use the materials for any commercial purpose;</li>
                <li>Attempt to decompile or reverse engineer any software contained in this application;</li>
                <li>Remove any copyright or other proprietary notations from the materials; or</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
              </ul>
              <p>
                This license shall automatically terminate if you violate any of these restrictions and may be
                terminated at any time. Upon terminating your viewing of these materials or upon the termination
                of this license, you must destroy any downloaded materials in your possession whether in electronic
                or printed format.
              </p>
              
              <h3 className="text-lg font-medium">3. Intellectual Property</h3>
              <p>
                All intellectual property rights in the application and its content (including without limitation
                the application design, text, graphics and all software and source codes connected with the application)
                are owned by or licensed to the application owner and are protected by copyright and other laws.
              </p>
              
              <h3 className="text-lg font-medium">4. Restrictions</h3>
              <p>You are specifically restricted from all of the following:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Publishing any application material in any other media;</li>
                <li>Selling, sublicensing and/or otherwise commercializing any application material;</li>
                <li>Publicly performing and/or showing any application material;</li>
                <li>Using this application in any way that is or may be damaging to this application;</li>
                <li>Using this application in any way that impacts user access to this application;</li>
                <li>Using this application contrary to applicable laws and regulations, or in any way may cause harm to the application, or to any person or business entity;</li>
                <li>Engaging in any data mining, data harvesting, data extracting or any other similar activity in relation to this application;</li>
                <li>Using this application to engage in any advertising or marketing.</li>
              </ul>
              
              <h3 className="text-lg font-medium">5. Limitation of Liability</h3>
              <p>
                The materials in this application are provided on an 'as is' basis. The application owner makes no
                warranties, expressed or implied, and hereby disclaims and negates all other warranties including,
                without limitation, implied warranties or conditions of merchantability, fitness for a particular
                purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
              <p>
                In no event shall the application owner be liable for any damages (including, without limitation,
                damages for loss of data or profit, or due to business interruption) arising out of the use or
                inability to use the materials in this application, even if the application owner has been notified
                orally or in writing of the possibility of such damage.
              </p>
              
              <h3 className="text-lg font-medium">6. Governing Law</h3>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws and you
                irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Policy</CardTitle>
              <CardDescription>Last updated: April 5, 2025</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <h3 className="text-lg font-medium">1. Information We Collect</h3>
              <p>
                We collect information that you provide directly to us when you register for an account,
                create or modify your profile, set preferences, or make purchases through the application.
                This information may include your name, email, password, and payment information.
              </p>
              <p>
                We also collect information about your usage of the application including:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Log information (pages visited, time spent, etc.)</li>
                <li>Device information (IP address, browser type, operating system, etc.)</li>
                <li>Neural network training data and predictions</li>
                <li>Market data you interact with</li>
              </ul>
              
              <h3 className="text-lg font-medium">2. How We Use Information</h3>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Develop new products and services</li>
                <li>Train and improve our neural network algorithms</li>
              </ul>
              
              <h3 className="text-lg font-medium">3. Data Storage and Security</h3>
              <p>
                We use commercially reasonable security measures to protect your information.
                However, no method of transmission over the Internet or electronic storage is 100% secure.
                Therefore, while we strive to use commercially acceptable means to protect your personal information,
                we cannot guarantee its absolute security.
              </p>
              
              <h3 className="text-lg font-medium">4. Third-Party Services</h3>
              <p>
                The application may contain links to third-party websites or services that are not owned or controlled
                by us. We have no control over, and assume no responsibility for, the content, privacy policies,
                or practices of any third-party websites or services.
              </p>
              
              <h3 className="text-lg font-medium">5. User Rights</h3>
              <p>
                You can access, update, or delete your account information at any time by logging into your account
                settings. You may also contact us directly to request access to, correction of, or deletion of any
                personal information that you have provided to us.
              </p>
              
              <h3 className="text-lg font-medium">6. Changes to Privacy Policy</h3>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting
                the new Privacy Policy on this page and updating the "Last Updated" date at the top.
              </p>
              
              <h3 className="text-lg font-medium">7. Contact Us</h3>
              <p>
                If you have any questions about this Privacy Policy, please contact us.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="license">
          <Card>
            <CardHeader>
              <CardTitle>License Information</CardTitle>
              <CardDescription>Proprietary Software License</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <h3 className="text-lg font-medium">Proprietary License</h3>
              <p>
                This application and its contents are proprietary software protected by copyright laws and international treaties.
                Unauthorized reproduction or distribution of this application, or any portion of it, may result in severe civil
                and criminal penalties, and will be prosecuted to the maximum extent possible under the law.
              </p>
              
              <h3 className="text-lg font-medium">Neural Network Algorithm License</h3>
              <p>
                The neural network algorithms, models, and training methodologies included in this application
                are proprietary and confidential. They are provided for use solely within this application and
                may not be extracted, reverse-engineered, or used in any other context without explicit written
                permission.
              </p>
              
              <h3 className="text-lg font-medium">Data Usage Restrictions</h3>
              <p>
                Market data, tick data, and any derivatives thereof that are processed, stored, or generated
                by this application remain the intellectual property of their respective owners. This application
                processes such data under license agreements with data providers and/or under fair use provisions.
              </p>
              <p>
                Users are prohibited from:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Redistributing any market data obtained through this application</li>
                <li>Using the data for purposes outside the intended functionality of this application</li>
                <li>Attempting to mine, scrape, or systematically collect data through this application</li>
              </ul>
              
              <h3 className="text-lg font-medium">Third-Party Components</h3>
              <p>
                This application includes third-party software components, each subject to its own license terms.
                A comprehensive list of these components and their respective licenses is available upon request.
              </p>
              
              <Separator className="my-4" />
              
              <p className="text-center">
                Copyright © 2025 Neural Network Ticks. All rights reserved.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="disclaimer">
          <Card>
            <CardHeader>
              <CardTitle>Disclaimer</CardTitle>
              <CardDescription>Important Notice Regarding This Application</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <h3 className="text-lg font-medium">Financial Risk Disclaimer</h3>
              <p>
                The information provided by this application is for informational and educational purposes only.
                It should not be considered financial or investment advice. Trading or investing in financial markets
                involves substantial risk of loss and is not suitable for all individuals.
              </p>
              <p>
                Past performance is not indicative of future results. The neural network predictions, analyses, and
                other information provided through this application are based on historical data and mathematical models,
                which have inherent limitations and may not accurately predict future market movements.
              </p>
              
              <h3 className="text-lg font-medium">No Guarantee of Accuracy</h3>
              <p>
                While we strive to provide accurate and up-to-date information, we make no representations or warranties
                of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability
                of the information, products, services, or related graphics contained in this application for any purpose.
              </p>
              
              <h3 className="text-lg font-medium">Limitation of Liability</h3>
              <p>
                In no event will we be liable for any loss or damage including without limitation, indirect or consequential
                loss or damage, or any loss or damage whatsoever arising from loss of data or profits arising out of, or in
                connection with, the use of this application.
              </p>
              
              <h3 className="text-lg font-medium">Demo and Simulation Mode</h3>
              <p>
                The application may include demo or simulation modes that use synthetic or historical data. Results obtained
                in these modes do not represent actual trading and may differ significantly from real-world scenarios due to
                market conditions, execution delays, and other factors.
              </p>
              
              <h3 className="text-lg font-medium">Technical Issues</h3>
              <p>
                The application relies on various technologies, including but not limited to WebSockets, databases, and
                neural network algorithms. Technical issues, including connectivity problems, server outages, and software
                bugs may affect the functionality of the application. We do not guarantee uninterrupted or error-free operation.
              </p>
              
              <h3 className="text-lg font-medium">Personal Responsibility</h3>
              <p>
                By using this application, you acknowledge and accept full responsibility for your financial decisions.
                You should conduct your own research and consult with qualified financial advisors before making any
                investment or trading decisions.
              </p>
              
              <Separator className="my-4" />
              
              <p className="text-center font-medium">
                USE THIS APPLICATION AT YOUR OWN RISK.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LegalInfo;
