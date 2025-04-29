
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

  // Funkcja do bezpośredniej aktualizacji hasła użytkownika
  const updateUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      console.log(`Attempting to directly update password for user ${userId}`);
      
      // Próba aktualizacji hasła użytkownika przez admin API
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );
      
      if (error) {
        console.error("Password update error:", error);
        return false;
      }
      
      console.log("Password updated successfully");
      return true;
    } catch (e) {
      console.error("Error updating password:", e);
      return false;
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole, newPassword?: string): Promise<RoleChangeResult> => {
    try {
      console.log(`Attempting to change role for user ${userId} to ${newRole}`);
      
      let passwordUpdated = false;
      
      if (newPassword) {
        console.log("Password update requested - attempting direct update first");
        
        // Próbuj najpierw bezpośrednio zaktualizować hasło
        passwordUpdated = await updateUserPassword(userId, newPassword);
        
        // Jeśli bezpośrednia aktualizacja nie powiodła się, wyślij email resetujący hasło
        if (!passwordUpdated) {
          console.log("Direct password update failed, falling back to reset email");
          
          // Pobierz email użytkownika
          const { data: userData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();
            
          if (userData?.email) {
            passwordUpdated = await sendPasswordResetEmail(userData.email);
          }
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
        passwordUpdated: newPassword ? passwordUpdated : undefined 
      };
    } catch (error) {
      console.error('Error in handleRoleChange:', error);
      throw error;
    }
  };

  return {
    handleRoleChange,
    sendPasswordResetEmail,
    updateUserPassword,
    isSubmitting
  };
};
