
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PasswordReset } from './auth/PasswordReset';

export const AuthRequired = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
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
  }, [navigate, location, isAuthenticated]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (isPasswordResetMode) {
    return <PasswordReset />;
  }

  return <>{children}</>;
};
