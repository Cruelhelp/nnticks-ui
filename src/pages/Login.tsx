
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { Github, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithProvider, signInAsGuest } = useAuth();
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');
    
    try {
      await signIn(loginEmail, loginPassword);
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');
    
    try {
      await signUp(signupEmail, signupPassword, signupUsername);
      navigate('/');
    } catch (error: any) {
      console.error('Signup error:', error);
      setAuthError(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProviderSignIn = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true);
      setAuthError('');
      await signInWithProvider(provider);
      // Redirect happens automatically after OAuth flow
    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      if (error.message.includes('provider is not enabled')) {
        setAuthError('This provider is not enabled. Please make sure OAuth is configured in Supabase.');
      } else {
        setAuthError(error.message || `Failed to sign in with ${provider}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGuestSignIn = async () => {
    try {
      setIsLoading(true);
      await signInAsGuest();
      navigate('/');
    } catch (error: any) {
      console.error('Guest login error:', error);
      setAuthError(error.message || 'Failed to sign in as guest');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 md:p-0">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size={48} />
          <h1 className="mt-4 text-2xl font-bold">Welcome to NNticks</h1>
          <p className="text-muted-foreground">Neural Network Prediction for Financial Markets</p>
        </div>
        
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Sign in to access your neural network predictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col space-y-4">
              <Button
                variant="outline"
                onClick={() => handleProviderSignIn('github')}
                className="w-full relative"
                disabled={isLoading}
              >
                <Github className="mr-2 h-4 w-4" /> Continue with GitHub
              </Button>
              <Button
                variant="outline"
                onClick={() => handleProviderSignIn('google')}
                className="w-full"
                disabled={isLoading}
              >
                <Mail className="mr-2 h-4 w-4" /> Continue with Google
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleGuestSignIn}
                className="w-full"
                disabled={isLoading}
              >
                Continue as Guest
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>
            </div>
            
            <Tabs defaultValue="login" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href="#"
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            <span>
              By continuing, you agree to the{' '}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </span>
          </CardFooter>
        </Card>
      </div>
      
      <footer className="mt-8 text-center text-xs text-muted-foreground">
        <p>Copyright © 2025 Ruel McNeil</p>
      </footer>
    </div>
  );
};

export default Login;
