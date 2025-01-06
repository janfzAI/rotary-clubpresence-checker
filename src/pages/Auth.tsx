import { useEffect, useState } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AuthError } from '@supabase/supabase-js';

const Auth = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (event === 'SIGNED_IN' && session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const getErrorMessage = (error: AuthError) => {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Nieprawidłowy adres email lub hasło.';
      case 'Email not confirmed':
        return 'Proszę potwierdzić adres email przed zalogowaniem.';
      default:
        return error.message;
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
      <SupabaseAuth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={[]}
        localization={{
          variables: {
            sign_in: {
              email_label: 'Adres email',
              password_label: 'Hasło',
              button_label: 'Zaloguj się',
              loading_button_label: 'Logowanie...',
            },
            sign_up: {
              email_label: 'Adres email',
              password_label: 'Hasło',
              button_label: 'Zarejestruj się',
              loading_button_label: 'Rejestracja...',
            },
          },
        }}
      />
    </div>
  );
};

export default Auth;