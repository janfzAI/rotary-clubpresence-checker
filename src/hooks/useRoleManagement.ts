
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole, RoleChangeResult } from '@/types/userRoles';

export const useRoleManagement = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
    try {
      console.log(`Sending password reset email to ${email}`);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`
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
      setIsSubmitting(true);
      
      let passwordResetSent = false;
      
      if (newPassword) {
        console.log("Password update requested - attempting to update password");
        
        // Instead of trying to use the admin API first, let's send a password reset email
        // Get user email
        const { data: userData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();
          
        if (userData?.email) {
          console.log(`Sending password reset email to ${userData.email}`);
          passwordResetSent = await sendPasswordResetEmail(userData.email);
        } else {
          console.error("Could not find email for user ID:", userId);
        }
      }

      // Handle role change based on the new role
      console.log(`Processing role change to ${newRole} for user ${userId}`);
      
      if (newRole === 'user') {
        console.log(`Removing any special roles for user ${userId}`);
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
        console.log(`Setting role ${newRole} for user ${userId}`);
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
      
      // Force a refresh of the session to update roles
      try {
        console.log("Forcing session refresh to update roles");
        await supabase.auth.refreshSession();
      } catch (refreshError) {
        console.error("Session refresh error:", refreshError);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleRoleChange,
    sendPasswordResetEmail,
    isSubmitting
  };
};
