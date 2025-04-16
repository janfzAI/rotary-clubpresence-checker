
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
      
      // Fetch all auth users using a direct RPC call to get ALL users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw authError;
      }

      console.log("Fetched auth users:", authUsers);
      
      // Fetch all profiles as a backup
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email');
      
      if (profilesError) {
        throw profilesError;
      }

      console.log("Fetched profiles:", profiles);

      // Fetch all user_roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        throw rolesError;
      }

      console.log("Fetched user roles:", userRoles);

      // Create a comprehensive list of users from both auth users and profiles
      // Start with auth users if available
      let allUsers = [];
      
      if (authUsers && authUsers.users) {
        allUsers = authUsers.users.map(user => ({
          id: user.id,
          email: user.email || '',
        }));
      } else {
        // Fallback to profiles if auth users not available
        allUsers = profiles.map(profile => ({
          id: profile.id,
          email: profile.email,
        }));
      }
      
      // Map users to roles
      const usersWithRoles = allUsers.map((user) => {
        // Find user's role in the userRoles array
        const userRole = userRoles.find(role => role.user_id === user.id);
        
        return {
          id: user.id,
          email: user.email,
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
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      if (newRole !== 'user') {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: newRole
          });
          
        if (insertError) throw insertError;
      }

      // Update the local state to reflect the change
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      return users.find(u => u.id === userId)?.email;
    } catch (error) {
      console.error('Error changing role:', error);
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
