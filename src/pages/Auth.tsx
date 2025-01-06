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
        // Create a session using Supabase's custom claims
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: token, // Using token as password for simplicity
        });

        if (error) {
          console.error('Supabase auth error:', error);
          throw error;
        }

        if (data.session) {
          console.log('Session created successfully:', data.session);
          navigate('/');
        }
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