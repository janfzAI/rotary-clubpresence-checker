import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    console.log('Attempting login with:', { email, token });

    // Simple validation for the demo account
    if (email === 'janfzjanfz@gmail.com' && token === 'admin123') {
      console.log('Valid credentials, creating session');
      
      try {
        // Use signInWithOtp instead of signInWithPassword
        const { data, error } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            data: {
              token: token // Store token in user metadata
            }
          }
        });

        if (error) {
          console.error('Supabase auth error:', error);
          throw error;
        }

        console.log('OTP sign in response:', data);
        
        // Since OTP sign in is asynchronous, we'll set up a listener for the auth state
        const authListener = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event, session);
          if (event === 'SIGNED_IN' && session) {
            console.log('Successfully signed in:', session);
            navigate('/');
          }
        });

        // Clean up the listener after 1 minute (should be enough for the email to arrive)
        setTimeout(() => {
          authListener.data.subscription.unsubscribe();
        }, 60000);

      } catch (error) {
        console.error('Login error:', error);
        setErrorMessage('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
      }
    } else {
      console.log('Invalid credentials');
      setErrorMessage('Nieprawidłowy email lub token.');
    }
  };

  return (
    <div className="container max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8 text-center">Rotary Club Szczecin</h1>
      
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Wprowadź email"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="token">Token</Label>
          <Input
            id="token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Wprowadź token"
            required
          />
        </div>

        <Button type="submit" className="w-full">
          Zaloguj się
        </Button>
      </form>
    </div>
  );
};

export default Auth;