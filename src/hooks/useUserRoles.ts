
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
      console.log(`Attempting to change role for user ${userId} to ${newRole}`);
      
      // Optimistically update the local state
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );

      // Update password if provided
      if (newPassword) {
        console.log("Attempting to update password...");
        // Note: This is an admin operation, ensure proper authorization
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: newPassword }
        );

        if (passwordError) {
          console.error("Password update error:", passwordError);
          throw passwordError;
        }
        console.log("Password updated successfully");
      }

      // Handle role change
      if (newRole === 'user') {
        // Remove role entry for 'user' (default role)
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          console.error("Error removing user role:", deleteError);
          throw deleteError;
        }
        console.log("User role removed successfully");
      } else {
        // Insert or update role
        const { error: upsertError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: newRole
          }, {
            onConflict: 'user_id' 
          });
          
        if (upsertError) {
          console.error("Detailed upsert error:", upsertError);
          throw upsertError;
        }
        console.log(`Role updated to ${newRole} successfully`);
      }

      // Refresh the users list to ensure we have the latest data
      await fetchUsers();

      // Return the email for confirmation
      const userEmail = users.find(u => u.id === userId)?.email;
      console.log(`Role change completed for ${userEmail}`);
      return userEmail;
    } catch (error) {
      console.error('Comprehensive role change error:', error);
      
      // Revert the optimistic update
      await fetchUsers();
      
      // Rethrow to allow calling component to handle the error
      throw error;
    }
  };

  const createUserAndSetRole = async (email: string, password: string, role: AppRole, memberName?: string) => {
    try {
      console.log("Starting user creation process for:", email);
      
      // First, check if the user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking for existing user:", checkError);
        throw checkError;
      }

      let userId;
      
      if (existingUser) {
        // User exists, we'll just update their role
        userId = existingUser.id;
        console.log("User already exists, will update role for:", email);
      } else {
        // User doesn't exist, create them using the admin API
        console.log("Creating new user with email:", email);
        
        if (!password) {
          throw new Error("Password is required to create a new user");
        }
        
        // Use the admin createUser function which is available on the client
        // for the Supabase instance with the correct service key
        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name: memberName,
            role: role
          }
        });

        if (createError) {
          console.error("Error creating user account:", createError);
          throw createError;
        }
        
        if (!userData || !userData.user) {
          throw new Error("Failed to create user account - no user data returned");
        }
        
        userId = userData.user.id;
        console.log("New user created with ID:", userId);
        
        // Create profile for the user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email
          });
          
        if (profileError) {
          console.error("Error creating profile:", profileError);
          throw profileError;
        }
        
        console.log("User profile created successfully");
      }
      
      // Set or update the user's role
      if (role !== 'user') {
        console.log(`Setting role '${role}' for user:`, userId);
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: role
          }, {
            onConflict: 'user_id'
          });
          
        if (roleError) {
          console.error("Error setting user role:", roleError);
          throw roleError;
        }
        
        console.log("User role set successfully");
      } else {
        // For 'user' role, we might want to remove any existing elevated roles
        const { error: deleteRoleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
          
        if (deleteRoleError && deleteRoleError.code !== 'PGRST116') { // Ignore if no rows were deleted
          console.error("Error removing existing roles:", deleteRoleError);
          throw deleteRoleError;
        }
        
        console.log("Default user role applied (existing roles removed if any)");
      }
      
      // Refresh the users list
      await fetchUsers();
      
      return email;
    } catch (error) {
      console.error('Error creating user and setting role:', error);
      throw error;
    }
  };

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
