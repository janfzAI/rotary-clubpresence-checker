import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUserSync = () => {
  const { toast } = useToast();

  const checkAndSyncUser = async (email: string, password: string) => {
    try {
      console.log(`Checking and syncing user: ${email}`);
      
      // Use the new Edge Function for user synchronization
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'sync_user',
          email,
          password
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: data.passwordSet ? "Konto zostało zsynchronizowane" : "Email resetujący hasło został wysłany",
          description: data.message,
          duration: 8000
        });

        return { 
          success: true, 
          message: data.message,
          passwordSet: data.passwordSet 
        };
      } else {
        throw new Error(data?.error || 'Wystąpił błąd podczas synchronizacji');
      }

    } catch (error: any) {
      console.error('Error in checkAndSyncUser:', error);
      
      // Fallback to password reset if Edge Function fails
      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`
        });

        if (resetError) {
          throw resetError;
        }

        toast({
          title: "Email resetujący hasło został wysłany",
          description: `Link do resetowania hasła został wysłany na adres ${email}. Sprawdź swoją skrzynkę pocztową i ustaw nowe hasło.`,
          duration: 8000
        });

        return { success: false, message: 'Password reset email sent as fallback' };
      } catch (fallbackError: any) {
        toast({
          title: "Błąd synchronizacji",
          description: error.message || 'Wystąpił błąd podczas synchronizacji użytkownika',
          variant: "destructive"
        });
        return { success: false, message: error.message };
      }
    }
  };

  return {
    checkAndSyncUser
  };
};