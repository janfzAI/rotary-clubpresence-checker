
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);

  // Oddzielna funkcja do sprawdzania roli użytkownika
  const checkUserRoles = useCallback(async (userId: string) => {
    try {
      console.log("Checking roles for user:", userId);
      
      // Check if user has admin role
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

      // Check if user has manager role
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
  }, []);

  // Funkcja do sprawdzania istnienia profilu i tworzenia go, jeśli nie istnieje
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

  // Funkcja do odświeżania uprawnień użytkownika - może być wywoływana z zewnątrz
  const refreshUserRoles = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
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
        setUserEmail(session?.user?.email ?? null);
        
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
      setUserEmail(session?.user?.email ?? null);
      
      if (session?.user) {
        // Używaj setTimeout aby uniknąć potencjalnych problemów z deadlockiem
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
