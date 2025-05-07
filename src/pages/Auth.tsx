
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertCircle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [detailedError, setDetailedError] = useState<any>(null);

  // Check session on load
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("User already logged in, redirecting to home page");
        navigate('/');
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setDetailedError(null);
    setLoading(true);
    
    console.log('Attempting login with:', { email });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (error) {
        console.error('Login error:', error);
        setDetailedError(error);
        
        if (error.message === 'Invalid login credentials') {
          setErrorMessage('Nieprawidłowy email lub hasło.');
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
      setDetailedError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (preset: 'admin' | 'user') => {
    setLoading(true);
    setErrorMessage('');
    setDetailedError(null);
    
    try {
      let loginInfo;
      
      if (preset === 'admin') {
        loginInfo = { 
          email: 'admin@rotaryszczecin.pl', 
          password: 'admin123' 
        };
        console.log('Attempting quick admin login with:', loginInfo);
      } else {
        loginInfo = { 
          email: 'user@rotaryszczecin.pl', 
          password: 'RCSZCZECIN' 
        };
        console.log('Attempting quick user login with:', loginInfo);
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginInfo.email.trim(),
        password: loginInfo.password,
      });
      
      if (error) {
        console.error('Quick login error:', error);
        setDetailedError(error);
        setErrorMessage(`Nie można zalogować z użytkownikiem ${preset}. Szczegóły błędu: ${error.message}`);
      } else {
        console.log('Quick login successful:', data);
        navigate('/');
      }
    } catch (error: any) {
      console.error('Quick login error:', error);
      setErrorMessage(`Wystąpił błąd podczas logowania: ${error.message}`);
      setDetailedError(error);
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
      
      {detailedError && (
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
          <p className="text-muted-foreground">Szczegóły błędu (dla deweloperów):</p>
          <pre className="overflow-auto whitespace-pre-wrap">
            {JSON.stringify(detailedError, null, 2)}
          </pre>
        </div>
      )}

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="login">Logowanie</TabsTrigger>
          <TabsTrigger value="quick">Szybkie logowanie</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
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
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Wprowadź hasło"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="quick">
          <div className="space-y-4">
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2">Administrator</h3>
              <p className="text-sm text-gray-500 mb-4">Pełny dostęp do zarządzania obecnością</p>
              <Button 
                onClick={() => handleQuickLogin('admin')} 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Logowanie...' : 'Zaloguj jako administrator'}
              </Button>
            </div>
            
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2">Użytkownik</h3>
              <p className="text-sm text-gray-500 mb-4">Dostęp tylko do odczytu danych</p>
              <Button 
                onClick={() => handleQuickLogin('user')} 
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Logowanie...' : 'Zaloguj jako użytkownik'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Auth;
