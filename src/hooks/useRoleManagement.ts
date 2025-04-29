
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

  // Poprawiona funkcja z dodatkową diagnostyką i lepszą obsługą błędów
  const updateUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      console.log(`[PASSWORD_UPDATE] Rozpoczynam aktualizację hasła dla użytkownika ${userId}`);
      console.log(`[PASSWORD_UPDATE] Długość hasła: ${newPassword.length}`);
      
      // Sprawdzenie minimalnej długości hasła
      if (newPassword.length < 6) {
        console.error("[PASSWORD_UPDATE] Hasło jest za krótkie (minimum 6 znaków)");
        toast({
          title: "Błąd",
          description: "Hasło musi mieć co najmniej 6 znaków",
          variant: "destructive"
        });
        return false;
      }
      
      // Sprawdzenie, czy bieżący użytkownik to admin@rotaryszczecin.pl (specjalne konto administratora)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        console.error("[PASSWORD_UPDATE] Brak zalogowanego użytkownika");
        toast({
          title: "Błąd",
          description: "Nie jesteś zalogowany. Zaloguj się ponownie.",
          variant: "destructive"
        });
        return false;
      }
      
      const isSpecialAdmin = currentUser.email === 'admin@rotaryszczecin.pl';
      console.log(`[PASSWORD_UPDATE] Bieżący użytkownik: ${currentUser.email}, isSpecialAdmin: ${isSpecialAdmin}`);
      
      if (!isSpecialAdmin) {
        console.error("[PASSWORD_UPDATE] Bieżący użytkownik nie jest specjalnym kontem administratora");
        toast({
          title: "Wymagane specjalne konto administratora",
          description: "Tylko użytkownik admin@rotaryszczecin.pl może bezpośrednio zmieniać hasła. Użyj tego konta z hasłem: admin123",
          variant: "destructive"
        });
        return false;
      }
      
      // Próba bezpośredniej aktualizacji hasła z API administracyjnym (najpierw metoda admin.updateUserById)
      console.log("[PASSWORD_UPDATE] Próba aktualizacji hasła z użyciem admin.updateUserById");
      const { error: adminUpdateError } = await supabase.auth.admin.updateUserById(
        userId, 
        { password: newPassword }
      );
      
      if (adminUpdateError) {
        console.error("[PASSWORD_UPDATE] Błąd aktualizacji hasła z admin API:", adminUpdateError);
        console.log("[PASSWORD_UPDATE] Próba użycia alternatywnej metody aktualizacji");
        
        // Druga próba - użycie alternatywnej metody (rzadziej używana, ale czasami działa)
        try {
          const SUPABASE_URL = "https://oxoxfhhwbavniybllumy.supabase.co";
          
          // FIX: Pobieramy sesję najpierw, a potem dopiero token z sesji
          const { data: { session } } = await supabase.auth.getSession();
          const SUPABASE_KEY = session?.access_token || '';
          
          console.log("[PASSWORD_UPDATE] Próba aktualizacji hasła z użyciem bezpośredniego API");
          
          const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({ password: newPassword })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Błąd aktualizacji hasła: ${errorData.message || response.statusText}`);
          }
          
          console.log("[PASSWORD_UPDATE] Hasło zaktualizowane pomyślnie przez bezpośrednie API!");
          toast({
            title: "Hasło zaktualizowane",
            description: "Hasło zostało pomyślnie zmienione.",
          });
          return true;
        } catch (directApiError: any) {
          console.error("[PASSWORD_UPDATE] Błąd bezpośredniej aktualizacji API:", directApiError);
          
          // Sprawdź, czy to błąd uprawnień
          if (adminUpdateError.message?.includes("user not allowed") || 
              adminUpdateError.message?.includes("not_admin") ||
              adminUpdateError.message?.includes("permission") ||
              adminUpdateError.message?.includes("role")) {
            
            console.error("[PASSWORD_UPDATE] Błąd uprawnień administratora Supabase");
            toast({
              title: "Brak uprawnień administratora Supabase",
              description: "Nawet konto admin@rotaryszczecin.pl nie ma wystarczających uprawnień w Supabase. Zalecamy użycie opcji resetowania hasła przez email.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Błąd aktualizacji hasła",
              description: adminUpdateError.message || "Wystąpił błąd podczas aktualizacji hasła.",
              variant: "destructive"
            });
          }
          
          return false;
        }
      }
      
      console.log("[PASSWORD_UPDATE] Hasło zaktualizowane pomyślnie!");
      
      toast({
        title: "Hasło zaktualizowane",
        description: "Hasło zostało pomyślnie zmienione.",
      });
      
      return true;
    } catch (e: any) {
      console.error("[PASSWORD_UPDATE] Błąd podczas aktualizacji hasła:", e);
      
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

