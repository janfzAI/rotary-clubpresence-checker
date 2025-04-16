
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUserEmail(session?.user?.email ?? null);
        
        if (session?.user) {
          console.log("Checking roles for user:", session.user.id);
          // Check if user has admin role
          const { data: isAdminData, error: adminError } = await supabase.rpc('has_role', {
            _user_id: session.user.id,
            _role: 'admin'
          });
          
          if (adminError) {
            console.error('Error checking admin role:', adminError);
          } else {
            setIsAdmin(!!isAdminData);
            console.log('User is admin:', !!isAdminData);
          }

          // Check if user has manager role
          const { data: isManagerData, error: managerError } = await supabase.rpc('has_role', {
            _user_id: session.user.id,
            _role: 'manager'
          });
          
          if (managerError) {
            console.error('Error checking manager role:', managerError);
          } else {
            setIsManager(!!isManagerData);
            console.log('User is manager:', !!isManagerData);
          }
        }
      } catch (error) {
        console.error("Error getting user session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getCurrentUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      setUserEmail(session?.user?.email ?? null);
      
      if (session?.user) {
        // Update admin status when auth state changes
        supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        }).then(({ data, error }) => {
          if (error) {
            console.error('Error checking admin role on auth state change:', error);
          } else {
            setIsAdmin(!!data);
            console.log('User is admin (auth state change):', !!data);
          }
        });

        // Update manager status when auth state changes
        supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'manager'
        }).then(({ data, error }) => {
          if (error) {
            console.error('Error checking manager role on auth state change:', error);
          } else {
            setIsManager(!!data);
            console.log('User is manager (auth state change):', !!data);
          }
        });
      } else {
        setIsAdmin(false);
        setIsManager(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    userEmail,
    isLoading,
    isAdmin,
    isManager,
    signOut
  };
};
