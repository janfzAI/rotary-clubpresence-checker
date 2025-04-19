
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole, RoleChangeResult } from '@/types/userRoles';

export const useRoleManagement = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
    try {
      console.log(`Sending password reset email to ${email}`);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });

      if (error) {
        console.error("Password reset email error:", error);
        return false;
      }
      
      console.log("Password reset email sent successfully");
      return true;
    } catch (e) {
      console.error("Error sending password reset email:", e);
      return false;
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole, newPassword?: string): Promise<RoleChangeResult> => {
    try {
      console.log(`Attempting to change role for user ${userId} to ${newRole}`);
      
      let passwordResetSent = false;
      
      if (newPassword) {
        console.log("Password update requested - will send reset email instead");
        
        // Pobierz email użytkownika
        const { data: userData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();
          
        if (userData?.email) {
          passwordResetSent = await sendPasswordResetEmail(userData.email);
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
        passwordUpdated: newPassword ? passwordResetSent : undefined 
      };
    } catch (error) {
      console.error('Error in handleRoleChange:', error);
      throw error;
    }
  };

  return {
    handleRoleChange,
    sendPasswordResetEmail,
    isSubmitting
  };
};
