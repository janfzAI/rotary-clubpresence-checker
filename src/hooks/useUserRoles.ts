import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserRole {
  id: string;
  email: string;
  role: AppRole;
}

export const useUserRoles = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Starting to fetch users...");
      
      // Get the authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Current authenticated user:", session?.user?.email);

      // First get all Auth users using the admin API
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error fetching auth users:", authError);
        throw authError;
      }
      
      if (!authUsers || !authUsers.users || authUsers.users.length === 0) {
        console.log("No auth users found - trying profiles table instead");
        
        // Fallback to profiles table
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email');
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }
        
        console.log("Fetched profiles:", profiles, "Count:", profiles?.length || 0);
        
        if (!profiles || profiles.length === 0) {
          console.log("No profiles found in the database");
          setUsers([]);
          return;
        }
        
        // Use the profiles we found
        processProfiles(profiles);
        return;
      }
      
      console.log("Fetched auth users:", authUsers.users, "Count:", authUsers.users.length);
      
      // Extract the user information we need
      const profiles = authUsers.users.map(user => ({
        id: user.id,
        email: user.email || 'No email'
      }));
      
      // Process the profiles to add role information
      processProfiles(profiles);
      
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      
      // If we couldn't get users using the admin API, fall back to using profiles
      console.log("Falling back to profiles table...");
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email');
        
        if (profilesError) {
          console.error("Error fetching profiles in fallback:", profilesError);
          throw profilesError;
        }
        
        console.log("Fetched profiles in fallback:", profiles, "Count:", profiles?.length || 0);
        
        if (profiles && profiles.length > 0) {
          processProfiles(profiles);
          return;
        }
        
        setError(error instanceof Error ? error : new Error('Unknown error fetching users'));
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        setError(fallbackError instanceof Error ? fallbackError : new Error('Failed to fetch users'));
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to process profiles and add role information
  const processProfiles = async (profiles: { id: string; email: string | null }[]) => {
    try {
      // Fetch all user_roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error("Error fetching user roles:", rolesError);
        throw rolesError;
      }

      console.log("Fetched user roles:", userRoles, "Count:", userRoles?.length || 0);
      
      // Map users to roles
      const usersWithRoles = profiles.map((profile) => {
        const userRole = userRoles ? userRoles.find(role => role.user_id === profile.id) : null;
        
        console.log(`Mapping profile ${profile.id} (${profile.email}) with role:`, 
          userRole ? userRole.role : 'user (default)');
        
        return {
          id: profile.id,
          email: profile.email || 'No email',
          // Default to 'user' if no role is found
          role: userRole ? userRole.role : 'user' as AppRole
        };
      });

      console.log("Final mapped users with roles:", usersWithRoles, "Count:", usersWithRoles.length);
      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error processing profiles:", error);
      throw error;
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      // For optimization, update optimistically first
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );

      if (newRole === 'user') {
        // Delete existing role
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        if (deleteError) throw deleteError;
      } else {
        // Upsert (insert or update) the role
        const { error: upsertError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: newRole
          }, {
            onConflict: 'user_id' 
          });
          
        if (upsertError) throw upsertError;
      }

      // Return the email for confirmation toast
      return users.find(u => u.id === userId)?.email;
    } catch (error) {
      console.error('Error changing role:', error);
      
      // If there was an error, revert the optimistic update
      fetchUsers();
      
      throw error;
    }
  };

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    handleRoleChange
  };
};
