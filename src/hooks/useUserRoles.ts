
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface UserRole {
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
      
      // Get all profiles from the profiles table
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
        setLoading(false);
        return;
      }
      
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
      console.error("Error in fetchUsers:", error);
      setError(error instanceof Error ? error : new Error('Unknown error fetching users'));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole, newPassword?: string) => {
    try {
      // For optimization, update optimistically first
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );

      // Update password if provided
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: newPassword }
        );

        if (passwordError) throw passwordError;
      }

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

  // New function to create a user if they don't exist yet
  const createUserAndSetRole = async (email: string, password: string, role: AppRole, memberName?: string) => {
    try {
      // First, check if the user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (checkError) throw checkError;

      let userId;
      
      if (existingUser) {
        // User exists, update their role
        userId = existingUser.id;
        console.log("User already exists, updating role for:", email);
      } else {
        // User doesn't exist, create them
        console.log("Creating new user with email:", email);
        
        // Create user in auth system
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: memberName
            }
          }
        });

        if (signUpError) throw signUpError;
        
        if (!authData.user) {
          throw new Error("Failed to create user account");
        }
        
        userId = authData.user.id;
        
        // Create profile for the user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email
          });
          
        if (profileError) throw profileError;
      }
      
      // Set or update the user's role
      if (role !== 'user') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: role
          }, {
            onConflict: 'user_id'
          });
          
        if (roleError) throw roleError;
      }
      
      // Refresh the users list
      await fetchUsers();
      
      return email;
    } catch (error) {
      console.error('Error creating user and setting role:', error);
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
    handleRoleChange,
    createUserAndSetRole
  };
};
