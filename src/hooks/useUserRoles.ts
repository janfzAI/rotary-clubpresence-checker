
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRoleManagement } from './useRoleManagement';
import { useUserCreation } from './useUserCreation';
import type { UserRole, AppRole, RoleChangeResult } from '@/types/userRoles';

export const useUserRoles = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(0);

  const { handleRoleChange } = useRoleManagement();
  const { createUserAndSetRole } = useUserCreation();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Starting to fetch users...");
      
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
      
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error("Error fetching user roles:", rolesError);
        throw rolesError;
      }

      console.log("Fetched user roles:", userRoles);
      
      const usersWithRoles = profiles.map((profile) => {
        const userRole = userRoles ? userRoles.find(role => role.user_id === profile.id) : null;
        
        return {
          id: profile.id,
          email: profile.email || 'No email',
          role: userRole ? userRole.role : 'user' as AppRole
        };
      });

      console.log("Combined users with roles:", usersWithRoles);
      setUsers(usersWithRoles);
      setLastUpdateTimestamp(Date.now());
    } catch (error) {
      console.error("Error in fetchUsers:", error);
      setError(error instanceof Error ? error : new Error('Unknown error fetching users'));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMemberRoleChange = async (
    memberName: string, 
    email: string, 
    role: AppRole, 
    password?: string
  ): Promise<RoleChangeResult> => {
    try {
      if (!email) {
        throw new Error("Email jest wymagany aby zarządzać uprawnieniami");
      }
      
      console.log(`Attempting to manage permissions for ${memberName} with email ${email} and role ${role}`);
      
      // First check if user exists in auth system by checking profiles table
      const { data: existingUsers, error: userCheckError } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', email);
        
      if (userCheckError) {
        console.error("Error checking for existing user:", userCheckError);
        throw userCheckError;
      }
      
      const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;
      
      if (existingUser) {
        console.log(`User exists with email ${email}, updating role to ${role}`);
        const result = await handleRoleChange(existingUser.id, role, password);
        
        // Force a delay to ensure database updates are propagated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh the local user data
        await fetchUsers();
        
        return result;
      } else {
        if (!password || password.length < 6) {
          throw new Error("Hasło jest wymagane (minimum 6 znaków) dla nowego użytkownika");
        }
        
        console.log(`No user found with email ${email}, creating new user`);
        try {
          const result = await createUserAndSetRole(email, password, role, memberName);
          
          // Force a delay to ensure database updates are propagated
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refresh the local user data
          await fetchUsers();
          
          return result;
        } catch (error: any) {
          // Check if error is about user already existing
          if (error.message && (error.message.includes('User already registered') || 
              (error.code === 'user_already_exists'))) {
            throw new Error("Użytkownik o podanym adresie email już istnieje w systemie, ale nie został znaleziony w profilu. Skontaktuj się z administratorem systemu.");
          }
          
          // Check if error is about permissions
          if (error.message && (error.message.includes('not_admin') || error.message.includes('User not allowed'))) {
            throw new Error("Twoje konto nie posiada uprawnień administratora Supabase do tworzenia użytkowników. Użyj istniejącego adresu email lub skontaktuj się z administratorem systemu.");
          }
          
          throw error;
        }
      }
    } catch (error) {
      console.error("Error in handleMemberRoleChange:", error);
      throw error;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Add a function to get the current role for a specific email
  const getRoleByEmail = useCallback((email: string): AppRole => {
    if (!email) return 'user';
    
    const user = users.find(u => 
      u.email.toLowerCase() === email.toLowerCase()
    );
    
    return user ? user.role : 'user';
  }, [users]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    handleRoleChange,
    createUserAndSetRole,
    handleMemberRoleChange,
    getRoleByEmail,
    lastUpdateTimestamp
  };
};
