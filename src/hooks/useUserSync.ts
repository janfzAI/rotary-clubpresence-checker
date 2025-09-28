import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUserSync = () => {
  const { toast } = useToast();

  const checkAndSyncUser = async (email: string, password: string) => {
    try {
      console.log(`Checking and syncing user: ${email}`);
      
      // First check if user exists in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking profile:', profileError);
        throw profileError;
      }

      if (!profile) {
        throw new Error('Użytkownik nie istnieje w systemie');
      }

      console.log(`Profile found for ${email}:`, profile);

      // Try to create the user in auth if they don't exist
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
          
          // Update profile with correct user ID if needed
          if (signupData.user.id !== profile.id) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ id: signupData.user.id })
              .eq('email', email);

            if (updateError) {
              console.error('Error updating profile ID:', updateError);
            }
          }

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