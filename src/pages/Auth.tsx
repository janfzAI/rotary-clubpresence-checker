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
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    
    console.log('Attempting login with:', { email });

    // Sprawdzanie czy to superadmin
    const validCredentials = [
      { email: 'janusz.kozlowski@infoludek.pl', token: 'admin123' },
      { email: 'janfzjanfz@gmail.com', token: 'admin123' }
    ];

    const isValidUser = validCredentials.some(cred => 
      cred.email === email.toLowerCase() && cred.token === token
    );

    if (!isValidUser) {
      setErrorMessage('Nieprawidłowy email lub token.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: token,
      });

      if (error) {
        console.error('Login error:', error);
        if (error.message === 'Invalid login credentials') {
          setErrorMessage('Nieprawidłowy email lub token.');
        } else {
          setErrorMessage('Błąd logowania. Spróbuj ponownie.');
        }
      } else {
        console.log('Login successful:', data);
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
    } finally {
      setLoading(false);
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Logowanie...' : 'Zaloguj się'}
        </Button>
      </form>
    </div>
  );
};

export default Auth;