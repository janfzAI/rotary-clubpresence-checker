
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

      let passwordUpdateSuccessful = true;
      
      // Update password if provided
      if (newPassword) {
        console.log("Attempting to update password...");
        
        try {
          // Note: This requires admin privileges
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            userId,
            { password: newPassword }
          );

          if (passwordError) {
            console.error("Password update error:", passwordError);
            passwordUpdateSuccessful = false;
            
            // If the error is due to permissions, we'll continue with role change
            if (!passwordError.message.includes('not_admin')) {
              throw passwordError;
            }
            
            console.log("Continuing with role update despite password update failure");
          } else {
            console.log("Password updated successfully");
          }
        } catch (e) {
          console.warn("Password update failed, but will continue with role update:", e);
          passwordUpdateSuccessful = false;
        }
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
      
      // Return email and password update status
      return { 
        email: userEmail, 
        passwordUpdated: passwordUpdateSuccessful 
      };
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
      console.log(`Attempting to create/update user ${email} with role ${role}`);
      
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
      let isNewUser = false;
      
      if (existingUser) {
        // User exists, update their role
        userId = existingUser.id;
        console.log("User already exists, updating role for:", email);
      } else {
        isNewUser = true;
        // User doesn't exist, create them
        console.log("Creating new user with email:", email);
        
        try {
          // Use the auth signup method first
          const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: memberName
              },
              emailRedirectTo: window.location.origin
            }
          });
          
          if (signupError) {
            console.error("Sign up error:", signupError);
            throw signupError;
          }
          
          if (!signupData.user) {
            throw new Error("Failed to create user account");
          }
          
          userId = signupData.user.id;
          console.log("User created successfully:", userId);
          
        } catch (authError) {
          console.error("Failed to create user via signup:", authError);
          
          // Fallback to admin.createUser if possible
          try {
            console.log("Attempting to create user with admin API...");
            const { data: userData, error: createError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: {
                name: memberName
              }
            });
            
            if (createError) {
              console.error("Admin user creation error:", createError);
              throw createError;
            }
            
            if (!userData.user) {
              throw new Error("Failed to create user account with admin API");
            }
            
            userId = userData.user.id;
            console.log("User created successfully with admin API:", userId);
            
          } catch (adminError) {
            console.error("Failed to create user with admin API:", adminError);
            throw new Error("Could not create user account. Please check your permissions or try another email.");
          }
        }
        
        // Create profile for the user
        if (userId) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: email
            });
            
          if (profileError) {
            console.error("Error creating profile:", profileError);
            if (profileError.code !== '23505') { // Not a duplicate key error
              throw profileError;
            }
          }
        }
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
          
        if (roleError) {
          console.error("Error setting role:", roleError);
          throw roleError;
        }
      } else {
        // For 'user' role, we delete any existing role entry
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
          
        if (deleteError && deleteError.code !== 'PGRST116') { // Not found is ok
          console.error("Error removing role:", deleteError);
          throw deleteError;
        }
      }
      
      // Refresh the users list
      await fetchUsers();
      
      return { email, isNewUser };
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
