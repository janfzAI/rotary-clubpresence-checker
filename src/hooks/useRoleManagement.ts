
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole, RoleChangeResult } from '@/types/userRoles';

export const useRoleManagement = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleChange = async (userId: string, newRole: AppRole, newPassword?: string): Promise<RoleChangeResult> => {
    try {
      console.log(`Attempting to change role for user ${userId} to ${newRole}`);
      
      let passwordUpdateSuccessful = true;
      
      if (newPassword) {
        console.log("Attempting to update password...");
        
        try {
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            userId,
            { password: newPassword }
          );

          if (passwordError) {
            console.error("Password update error:", passwordError);
            passwordUpdateSuccessful = false;
            
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

      if (newRole === 'user') {
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

      const { data: userData } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      
      return { 
        email: userData?.email || '', 
        passwordUpdated: newPassword ? passwordUpdateSuccessful : undefined 
      };
    } catch (error) {
      console.error('Error in handleRoleChange:', error);
      throw error;
    }
  };

  return {
    handleRoleChange,
    isSubmitting
  };
};
