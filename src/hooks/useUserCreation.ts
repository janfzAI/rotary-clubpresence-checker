
import { supabase } from '@/integrations/supabase/client';
import type { AppRole, RoleChangeResult } from '@/types/userRoles';

export const useUserCreation = () => {
  const createUserAndSetRole = async (
    email: string, 
    password: string, 
    role: AppRole, 
    memberName?: string
  ): Promise<RoleChangeResult> => {
    try {
      console.log(`Creating user: ${email} with role: ${role}`);
      
      // Use the new Edge Function for user creation
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create_user',
          email,
          password,
          memberName
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Nie udało się utworzyć użytkownika');
      }

      const userId = data.user?.id;
      if (!userId) {
        throw new Error('Nie otrzymano ID użytkownika');
      }

      // Set the role using the regular Supabase client
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role
        });

      if (roleError) {
        console.error('Error setting role:', roleError);
        // Don't throw here, user was created successfully
      }

      console.log(`User ${email} created with role ${role}`);
      
      // Store email in localStorage for the session refresh
      localStorage.setItem('pendingUserEmail', email);
      
      return {
        email: email,
        passwordUpdated: false,
        isNewUser: !data.message.includes('już istnieje')
      };
      
    } catch (error: any) {
      console.error('Error in createUserAndSetRole:', error);
      throw error;
    }
  };

  return {
    createUserAndSetRole
  };
};
