
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PasswordReset } from './auth/PasswordReset';
import { useToast } from '@/hooks/use-toast';

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
          // Try to set the access token in the session
          try {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: ''
            });
            
            if (error) {
              console.error('Error setting session from recovery token:', error);
              toast({
                title: "Błąd resetowania hasła",
                description: "Link do resetowania hasła wygasł lub jest nieprawidłowy. Spróbuj ponownie.",
                variant: "destructive"
              });
              navigate('/auth');
              return;
            }
          } catch (e) {
            console.error('Exception setting session from recovery token:', e);
          }
          
          setIsPasswordResetMode(true);
          setIsLoading(false);
          return;
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

    // Set up the auth state change listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        navigate('/auth');
      } else if (event === 'SIGNED_IN' && !isAuthenticated) {
        setIsAuthenticated(true);
      } else if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordResetMode(true);
      } else if (event === 'USER_UPDATED') {
        console.log('User updated, refreshing session');
        setIsAuthenticated(!!session);
      }
    });

    // Then check for existing session
    checkAuth();
    
    // Cleanup function to unsubscribe
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
