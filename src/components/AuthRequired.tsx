
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PasswordReset } from './auth/PasswordReset';
import { useToast } from "@/hooks/use-toast";

export const AuthRequired = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const [adminLoginAttempted, setAdminLoginAttempted] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a password reset token in URL
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const type = hashParams.get('type');
        const accessToken = hashParams.get('access_token');
        
        if (type === 'recovery' && accessToken) {
          console.log('[PASSWORD_RESET] Wykryto token resetowania hasła w URL');
          setIsPasswordResetMode(true);
          setIsLoading(false);
          return;
        }
        
        // Special handling for admin account - more explicit message for better debugging
        if (location.search.includes('admin=true') && !adminLoginAttempted) {
          setAdminLoginAttempted(true); // Ustawienie flagi, aby zapobiec wielokrotnym próbom logowania
          console.log('[ADMIN LOGIN] Wykryto parametr admin=true, próba automatycznego logowania jako admin');
          
          // Najpierw wyloguj aktualnego użytkownika, aby uniknąć błędów
          try {
            await supabase.auth.signOut();
            console.log('[ADMIN LOGIN] Wylogowano poprzedniego użytkownika');
          } catch (signOutErr) {
            console.error('[ADMIN LOGIN] Błąd podczas wylogowywania:', signOutErr);
          }
          
          // Krótkie opóźnienie przed próbą logowania
          await new Promise(resolve => setTimeout(resolve, 500));
          
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: 'admin@rotaryszczecin.pl',
              password: 'admin123'
            });
            
            if (error) {
              console.error('[ADMIN LOGIN] Błąd automatycznego logowania jako admin:', error);
              toast({
                title: "Błąd logowania jako admin",
                description: `Nie udało się zalogować jako admin: ${error.message}. Spróbuj zalogować się ręcznie jako admin@rotaryszczecin.pl z hasłem admin123.`,
                variant: "destructive",
                duration: 8000
              });
            } else {
              console.log('[ADMIN LOGIN] Automatyczne logowanie jako admin zakończone sukcesem', data.user?.email);
              localStorage.setItem('adminLoginHint', 'admin@rotaryszczecin.pl');
              
              // Odczekaj chwilę, aby sesja została poprawnie ustanowiona
              await new Promise(resolve => setTimeout(resolve, 500));
              
              toast({
                title: "Zalogowano jako administrator",
                description: "Zalogowano automatycznie jako administrator systemu (admin@rotaryszczecin.pl). Teraz możesz bezpośrednio zmieniać hasła użytkowników.",
                duration: 6000
              });
              
              // Odśwież stronę bez parametru admin=true, aby uniknąć pętli logowania
              window.location.href = window.location.pathname;
              return;
            }
          } catch (err) {
            console.error('[ADMIN LOGIN] Nieoczekiwany błąd podczas logowania jako admin:', err);
          }
        }
        
        // Check for admin account in local storage to help with debugging
        const storedEmail = localStorage.getItem('adminLoginHint');
        if (storedEmail === 'admin@rotaryszczecin.pl') {
          console.log('[ADMIN LOGIN] Wykryto konto administratora w localStorage');
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Sprawdzanie sesji uwierzytelniania:', session?.user?.email);
        
        if (error) {
          console.error('Błąd sesji:', error);
          navigate('/auth');
          return;
        }

        if (!session) {
          console.log('Nie znaleziono aktywnej sesji');
          navigate('/auth');
          return;
        }

        // Session exists, user is authenticated
        setIsAuthenticated(true);

        // Special handling for admin account with more detailed messages
        if (session.user.email === 'admin@rotaryszczecin.pl') {
          console.log('[ADMIN LOGIN] Wykryto konto administratora, upewnianie się, że rola administratora jest przypisana');
          toast({
            title: "Pełne uprawnienia administratora",
            description: "Zalogowano jako główny administrator systemu (admin@rotaryszczecin.pl). Masz dostęp do wszystkich funkcji, w tym zmiany haseł.",
            duration: 6000
          });
          
          // Ensure the admin role is assigned in the database
          try {
            const { data, error } = await supabase
              .from('user_roles')
              .select('*')
              .eq('user_id', session.user.id)
              .eq('role', 'admin');
            
            if (error) {
              console.error('Błąd sprawdzania roli administratora:', error);
            } else if (!data || data.length === 0) {
              console.log('Dodawanie roli administratora do bazy danych dla konta admin');
              const { error: insertError } = await supabase
                .from('user_roles')
                .insert({
                  user_id: session.user.id,
                  role: 'admin'
                });
                
              if (insertError) {
                console.error('Błąd dodawania roli administratora:', insertError);
              }
            }
          } catch (e) {
            console.error('Błąd zapewniania roli administratora:', e);
          }
        } else {
          // Not the special admin account, show a clear notification
          toast({
            title: "Ograniczone uprawnienia",
            description: `Aby uzyskać pełny dostęp administratora (w tym zmianę haseł), zaloguj się jako admin@rotaryszczecin.pl (hasło: admin123).`,
            duration: 8000
          });
        }

        // Refresh session if it exists
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Błąd odświeżania sesji:', refreshError);
          navigate('/auth');
          return;
        }

      } catch (error) {
        console.error('Błąd sprawdzania uwierzytelnienia:', error);
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Zmiana stanu uwierzytelnienia:', event, session?.user?.email);
      
      // Store admin email hint if this is the admin account
      if (event === 'SIGNED_IN' && session?.user?.email === 'admin@rotaryszczecin.pl') {
        localStorage.setItem('adminLoginHint', 'admin@rotaryszczecin.pl');
        toast({
          title: "Konto administratora aktywne",
          description: "Zalogowano jako główny administrator systemu. Masz dostęp do wszystkich funkcji, w tym zmiany haseł.",
          duration: 6000
        });
      }
      
      // Only redirect to auth page if user explicitly signs out
      // Don't redirect for other auth events like SIGNED_IN
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        navigate('/auth');
      } else if (event === 'SIGNED_IN' && !isAuthenticated) {
        setIsAuthenticated(true);
      } else if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordResetMode(true);
      }
    });

    checkAuth();
    return () => subscription.unsubscribe();
  }, [navigate, location, isAuthenticated, toast, adminLoginAttempted]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (isPasswordResetMode) {
    return <PasswordReset />;
  }

  return <>{children}</>;
};
