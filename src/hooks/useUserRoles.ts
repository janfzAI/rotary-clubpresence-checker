
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles
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

      // Map profiles to user roles
      const usersWithRoles = profiles.map((profile) => {
        // Find user's role in the userRoles array
        const userRole = userRoles.find(role => role.user_id === profile.id);
        
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
      throw error;
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

      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      return users.find(u => u.id === userId)?.email;
    } catch (error) {
      console.error('Error changing role:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    fetchUsers,
    handleRoleChange
  };
};
