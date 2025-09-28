import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUserSync = () => {
  const { toast } = useToast();

  const checkAndSyncUser = async (email: string, password: string) => {
    try {
      console.log(`Checking and syncing user: ${email}`);
      
      // Try to create the user in auth directly - if they exist in profiles, this should work
      try {
        const { data: signupData, error: signupError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { synced: true }
        });

        if (signupError) {
          if (signupError.message?.includes('already exists')) {
            console.log('User already exists in auth, sending password reset');
            // User exists in auth but password is wrong, send reset email
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/`
            });

            if (resetError) {
              throw new Error(`Nie udało się wysłać emaila resetującego hasło: ${resetError.message}`);
            }

            toast({
              title: "Email resetujący hasło został wysłany",
              description: `Link do resetowania hasła został wysłany na adres ${email}. Sprawdź swoją skrzynkę pocztową i ustaw nowe hasło.`,
              duration: 8000
            });

            return { success: false, message: 'Password reset email sent' };
          }
          
          throw signupError;
        }

        if (signupData?.user) {
          console.log('User created in auth successfully');
          
          toast({
            title: "Konto zostało zsynchronizowane",
            description: `Użytkownik ${email} może się teraz zalogować używając hasła: ${password}`,
            duration: 8000
          });

          return { success: true, message: 'User synced successfully' };
        }
      } catch (authError: any) {
        console.error('Auth error:', authError);
        
        if (authError.status === 403 || authError.message?.includes('not allowed')) {
          // Fallback: send password reset email
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/`
          });

          if (resetError) {
            throw new Error(`Nie udało się wysłać emaila resetującego hasło: ${resetError.message}`);
          }

          toast({
            title: "Email resetujący hasło został wysłany",
            description: `Brak uprawnień do tworzenia konta. Link do resetowania hasła został wysłany na adres ${email}.`,
            duration: 8000
          });

          return { success: false, message: 'Password reset email sent due to permissions' };
        }
        
        throw authError;
      }

    } catch (error: any) {
      console.error('Error in checkAndSyncUser:', error);
      toast({
        title: "Błąd synchronizacji",
        description: error.message || 'Wystąpił błąd podczas synchronizacji użytkownika',
        variant: "destructive"
      });
      return { success: false, message: error.message };
    }
  };

  return {
    checkAndSyncUser
  };
};