
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRoleManagement } from './useRoleManagement';
import { useUserCreation } from './useUserCreation';
import type { UserRole, AppRole, RoleChangeResult } from '@/types/userRoles';

export const useUserRoles = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { handleRoleChange } = useRoleManagement();
  const { createUserAndSetRole } = useUserCreation();

  const fetchUsers = async () => {
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

      const usersWithRoles = profiles.map((profile) => {
        const userRole = userRoles ? userRoles.find(role => role.user_id === profile.id) : null;
        
        return {
          id: profile.id,
          email: profile.email || 'No email',
          role: userRole ? userRole.role : 'user' as AppRole
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error in fetchUsers:", error);
      setError(error instanceof Error ? error : new Error('Unknown error fetching users'));
    } finally {
      setLoading(false);
    }
  };

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
      
      const { data: existingUsers, error: userCheckError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email);
        
      if (userCheckError) {
        console.error("Error checking for existing user:", userCheckError);
        throw userCheckError;
      }
      
      const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;
      
      if (existingUser) {
        console.log(`User exists with email ${email}, updating role to ${role}`);
        return await handleRoleChange(existingUser.id, role, password);
      } else {
        if (!password || password.length < 6) {
          throw new Error("Hasło jest wymagane (minimum 6 znaków) dla nowego użytkownika");
        }
        
        console.log(`No user found with email ${email}, creating new user`);
        return await createUserAndSetRole(email, password, role, memberName);
      }
    } catch (error) {
      console.error("Error in handleMemberRoleChange:", error);
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
    createUserAndSetRole,
    handleMemberRoleChange
  };
};
