
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole, RoleChangeResult } from '@/types/userRoles';
import { useToast } from '@/hooks/use-toast';

export const useRoleManagement = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
    try {
      console.log(`Sending password reset email to ${email}`);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`
      });

      if (error) {
        console.error("Password reset email error:", error);
        toast({
          title: "Błąd",
          description: `Nie udało się wysłać emaila resetującego hasło: ${error.message}`,
          variant: "destructive"
        });
        return false;
      }
      
      console.log("Password reset email sent successfully");
      toast({
        title: "Email wysłany",
        description: `Link do resetowania hasła został wysłany na adres ${email}`
      });
      return true;
    } catch (e: any) {
      console.error("Error sending password reset email:", e);
      toast({
        title: "Błąd",
        description: `Wystąpił błąd podczas wysyłania emaila: ${e.message || "Nieznany błąd"}`,
        variant: "destructive"
      });
      return false;
    }
  };

  // Improved function with more debugging and better error handling
  const updateUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      console.log(`[PASSWORD_UPDATE] Attempting to update password for user ${userId}`);
      
      // First, check if the current user is admin@rotaryszczecin.pl (special admin account)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        console.error("[PASSWORD_UPDATE] No user is currently logged in");
        toast({
          title: "Błąd",
          description: "Nie jesteś zalogowany. Zaloguj się ponownie.",
          variant: "destructive"
        });
        return false;
      }
      
      const isSpecialAdmin = currentUser.email === 'admin@rotaryszczecin.pl';
      console.log(`[PASSWORD_UPDATE] Current user: ${currentUser.email}, isSpecialAdmin: ${isSpecialAdmin}`);
      
      if (!isSpecialAdmin) {
        console.error("[PASSWORD_UPDATE] Current user is not the special admin account");
        toast({
          title: "Wymagane specjalne konto administratora",
          description: "Tylko użytkownik admin@rotaryszczecin.pl może bezpośrednio zmieniać hasła. Użyj tego konta z hasłem: admin123",
          variant: "destructive"
        });
        return false;
      }
      
      // Try to update the password using admin API
      console.log("[PASSWORD_UPDATE] Updating password using admin API...");
      console.log(`[PASSWORD_UPDATE] Attempting to update user: ${userId} with password length: ${newPassword.length}`);
      
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );
      
      if (error) {
        console.error("[PASSWORD_UPDATE] Password update error:", error);
        
        // Check for specific error codes
        if (error.message?.includes("user not allowed") || error.message?.includes("not_admin")) {
          console.error("[PASSWORD_UPDATE] User not allowed to update passwords directly");
          toast({
            title: "Brak uprawnień administratora Supabase",
            description: "Nawet konto admin@rotaryszczecin.pl nie ma wystarczających uprawnień w Supabase. Skontaktuj się z administratorem systemu lub użyj opcji resetowania hasła.",
            variant: "destructive"
          });
          return false;
        }
        
        toast({
          title: "Błąd aktualizacji hasła",
          description: error.message || "Wystąpił błąd podczas aktualizacji hasła.",
          variant: "destructive"
        });
        
        return false;
      }
      
      console.log("[PASSWORD_UPDATE] Password updated successfully!");
      
      toast({
        title: "Hasło zaktualizowane",
        description: "Hasło zostało pomyślnie zmienione.",
      });
      
      return true;
    } catch (e: any) {
      console.error("[PASSWORD_UPDATE] Error updating password:", e);
      
      toast({
        title: "Błąd aktualizacji hasła",
        description: e.message || "Wystąpił nieoczekiwany błąd. Sprawdź konsolę developerską po więcej szczegółów.",
        variant: "destructive"
      });
      
      return false;
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole, newPassword?: string): Promise<RoleChangeResult> => {
    setIsSubmitting(true);
    try {
      console.log(`Attempting to change role for user ${userId} to ${newRole}`);
      
      let passwordUpdated = false;
      
      if (newPassword) {
        console.log("Password update requested - attempting direct update first");
        
        // Try direct password update first
        passwordUpdated = await updateUserPassword(userId, newPassword);
        
        // If direct update failed, send reset email
        if (!passwordUpdated) {
          console.log("Direct password update failed, falling back to reset email");
          
          // Get user's email
          const { data: userData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();
            
          if (userData?.email) {
            const resetEmailSent = await sendPasswordResetEmail(userData.email);
            passwordUpdated = resetEmailSent;
            
            if (resetEmailSent) {
              toast({
                title: "Link resetujący hasło wysłany",
                description: `Email z linkiem do resetowania hasła został wysłany na adres ${userData.email}`,
              });
            }
          } else {
            console.error("Could not find email for user", userId);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleRoleChange,
    sendPasswordResetEmail,
    updateUserPassword,
    isSubmitting
  };
};
