
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a password reset token in URL
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const type = hashParams.get('type');
        const accessToken = hashParams.get('access_token');
        
        if (type === 'recovery' && accessToken) {
          console.log('Password reset detected in URL');
          setIsPasswordResetMode(true);
          setIsLoading(false);
          return;
        }
        
        // Special handling for admin account
        if (location.search.includes('admin=true')) {
          console.log('Admin login parameter detected, attempting admin login');
          try {
            const { error } = await supabase.auth.signInWithPassword({
              email: 'admin@rotaryszczecin.pl',
              password: 'admin123'
            });
            
            if (error) {
              console.error('Admin auto-login failed:', error);
              toast({
                title: "Błąd logowania jako admin",
                description: "Nie udało się automatycznie zalogować jako administrator. Spróbuj zalogować się ręcznie.",
                variant: "destructive"
              });
            } else {
              console.log('Admin auto-login successful');
              localStorage.setItem('adminLoginHint', 'admin@rotaryszczecin.pl');
              toast({
                title: "Zalogowano jako administrator",
                description: "Zalogowano automatycznie jako administrator systemu (admin@rotaryszczecin.pl)."
              });
              // Remove the query parameter to avoid repeated logins
              navigate('/', { replace: true });
              return;
            }
          } catch (err) {
            console.error('Admin auto-login error:', err);
          }
        }
        
        // Check for admin account in local storage to help with debugging
        const storedEmail = localStorage.getItem('adminLoginHint');
        if (storedEmail === 'admin@rotaryszczecin.pl') {
          console.log('Admin account detected in local storage');
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Checking auth session:', session);
        
        if (error) {
          console.error('Session error:', error);
          navigate('/auth');
          return;
        }

        if (!session) {
          console.log('No active session found');
          navigate('/auth');
          return;
        }

        // Session exists, user is authenticated
        setIsAuthenticated(true);

        // Special handling for admin account
        if (session.user.email === 'admin@rotaryszczecin.pl') {
          console.log('Admin account detected, ensuring admin role is assigned');
          toast({
            title: "Konto administratora",
            description: "Zalogowano jako główny administrator systemu. Masz dostęp do wszystkich funkcji, w tym zmiany haseł."
          });
          
          // Ensure the admin role is assigned in the database
          try {
            const { data, error } = await supabase
              .from('user_roles')
              .select('*')
              .eq('user_id', session.user.id)
              .eq('role', 'admin');
            
            if (error) {
              console.error('Error checking admin role:', error);
            } else if (!data || data.length === 0) {
              console.log('Adding admin role to database for admin account');
              const { error: insertError } = await supabase
                .from('user_roles')
                .insert({
                  user_id: session.user.id,
                  role: 'admin'
                });
                
              if (insertError) {
                console.error('Error adding admin role:', insertError);
              }
            }
          } catch (e) {
            console.error('Error ensuring admin role:', e);
          }
        } else {
          // Not the special admin account, show a hint
          toast({
            title: "Ograniczone uprawnienia",
            description: `Aby uzyskać pełne uprawnienia administratora, w tym zmianę haseł, zaloguj się jako admin@rotaryszczecin.pl (hasło: admin123).`,
            duration: 8000
          });
        }

        // Refresh session if it exists
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Session refresh error:', refreshError);
          navigate('/auth');
          return;
        }

      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      
      // Store admin email hint if this is the admin account
      if (event === 'SIGNED_IN' && session?.user?.email === 'admin@rotaryszczecin.pl') {
        localStorage.setItem('adminLoginHint', 'admin@rotaryszczecin.pl');
        toast({
          title: "Konto administratora",
          description: "Zalogowano jako główny administrator systemu. Masz dostęp do wszystkich funkcji, w tym zmiany haseł."
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
  }, [navigate, location, isAuthenticated, toast]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (isPasswordResetMode) {
    return <PasswordReset />;
  }

  return <>{children}</>;
};
