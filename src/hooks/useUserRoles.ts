
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
      
      // Fetch all profiles directly from profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email');
      
      if (profilesError) {
        throw profilesError;
      }

      console.log("Fetched profiles:", profiles);
      
      if (!profiles || profiles.length === 0) {
        setUsers([]);
        console.log("No profiles found");
        return;
      }

      // Fetch all user_roles with a separate query
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        throw rolesError;
      }

      console.log("Fetched user roles:", userRoles);
      
      // Map users to roles with improved logging
      const usersWithRoles = profiles.map((profile) => {
        // Find user's role in the userRoles array
        const userRole = userRoles ? userRoles.find(role => role.user_id === profile.id) : null;
        
        return {
          id: profile.id,
          email: profile.email,
          // Default to 'user' if no role is found
          role: userRole ? userRole.role : 'user' as AppRole
        };
      });

      setUsers(usersWithRoles);
      console.log("Mapped users with roles:", usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setLoading(false);
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
