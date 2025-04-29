
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);

  // Separate function to check user roles
  const checkUserRoles = useCallback(async (userId: string) => {
    try {
      console.log("Checking roles for user:", userId);
      
      // Special case for admin@rotaryszczecin.pl - always grant admin access
      const isAdminEmail = userEmail === 'admin@rotaryszczecin.pl';
      if (isAdminEmail) {
        console.log('Special admin account detected, granting admin privileges');
        setIsAdmin(true);
        setIsManager(true);
        
        // Ensure admin role exists in database
        try {
          const { data, error } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', userId)
            .eq('role', 'admin');
          
          if (error) {
            console.error('Error checking admin role:', error);
          } else if (!data || data.length === 0) {
            console.log('Adding admin role to database for admin account');
            const { error: insertError } = await supabase
              .from('user_roles')
              .insert({
                user_id: userId,
                role: 'admin'
              });
              
            if (insertError) {
              console.error('Error adding admin role:', insertError);
            }
          }
        } catch (e) {
          console.error('Error ensuring admin role:', e);
        }
        
        return;
      }
      
      // Check if user has admin role using supabase RPC to avoid security issues
      const { data: isAdminData, error: adminError } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });
      
      if (adminError) {
        console.error('Error checking admin role:', adminError);
      } else {
        setIsAdmin(!!isAdminData);
        console.log('User is admin:', !!isAdminData);
      }

      // Check if user has manager role using supabase RPC to avoid security issues
      const { data: isManagerData, error: managerError } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'manager'
      });
      
      if (managerError) {
        console.error('Error checking manager role:', managerError);
      } else {
        setIsManager(!!isManagerData);
        console.log('User is manager:', !!isManagerData);
      }
    } catch (error) {
      console.error("Error checking user roles:", error);
    }
  }, [userEmail]);

  // Function to ensure profile exists
  const ensureProfileExists = useCallback(async (userId: string, userEmail: string | null) => {
    try {
      if (!userEmail) return;
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        console.log('Creating profile for user:', userId);
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userEmail
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
        }
      }
    } catch (error) {
      console.error("Error ensuring profile exists:", error);
    }
  }, []);

  // Function to refresh user roles - can be called from outside
  const refreshUserRoles = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log("Refreshing roles for user:", session.user.email);
        await checkUserRoles(session.user.id);
      }
    } catch (error) {
      console.error("Error refreshing user roles:", error);
    }
  }, [checkUserRoles]);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email ?? null;
        setUserEmail(email);
        
        console.log("Current user session:", email);
        
        if (session?.user) {
          await checkUserRoles(session.user.id);
          await ensureProfileExists(session.user.id, session.user.email);
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
      const email = session?.user?.email ?? null;
      setUserEmail(email);
      
      if (session?.user) {
        // Use setTimeout to avoid potential deadlock issues
        setTimeout(() => {
          checkUserRoles(session.user.id);
          ensureProfileExists(session.user.id, session.user.email);
        }, 0);
      } else {
        setIsAdmin(false);
        setIsManager(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkUserRoles, ensureProfileExists]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    userEmail,
    isLoading,
    isAdmin,
    isManager,
    signOut,
    refreshUserRoles
  };
};
