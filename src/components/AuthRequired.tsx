import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const AuthRequired = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
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
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    checkAuth();
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return <>{children}</>;
};