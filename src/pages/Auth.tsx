
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [successMessage, setSuccessMessage] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      if (isResetMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        });
        
        if (error) throw error;
        
        setSuccessMessage('Link do resetowania hasła został wysłany na podany adres email.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password: password,
        });

        if (error) throw error;
        
        console.log('Login successful:', data);
        navigate('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setErrorMessage(error.message || 'Wystąpił błąd podczas logowania.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (preset: 'admin' | 'user') => {
    setLoading(true);
    setErrorMessage('');
    
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
        setErrorMessage(`Nie można zalogować z użytkownikiem ${preset}. Szczegóły błędu: ${error.message}`);
      } else {
        console.log('Quick login successful:', data);
        navigate('/');
      }
    } catch (error: any) {
      console.error('Quick login error:', error);
      setErrorMessage(`Wystąpił błąd podczas logowania: ${error.message}`);
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

      {successMessage && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-300">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={isResetMode ? "reset" : "login"} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="login" onClick={() => setIsResetMode(false)}>
            Logowanie
          </TabsTrigger>
          <TabsTrigger value="reset" onClick={() => setIsResetMode(true)}>
            Reset hasła
          </TabsTrigger>
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
                required={!isResetMode}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="reset">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Wprowadź email do resetowania hasła"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Wysyłanie...' : 'Wyślij link do resetowania'}
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
