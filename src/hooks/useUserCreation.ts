
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
      console.log(`Attempting to create/update user ${email} with role ${role}`);
      
      let userId: string;
      let isNewUser = true;
      
      try {
        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();
          
        if (existingUser?.id) {
          console.log("User with this email already exists:", existingUser.id);
          // Use the existing user ID instead of creating new
          userId = existingUser.id;
          isNewUser = false;
        } else {
          // Try to create new user with signUp first
          const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name: memberName },
              emailRedirectTo: window.location.origin
            }
          });
          
          if (signupError) {
            console.error("Sign up error:", signupError);
            
            // Check if error is about user already exists
            if (signupError.message?.includes('User already registered')) {
              throw new Error("Użytkownik o podanym adresie email już istnieje w systemie auth, ale nie znaleziono go w profilach. Skontaktuj się z administratorem systemu.");
            }
            
            throw signupError;
          }
          
          if (!signupData.user) {
            throw new Error("Failed to create user account");
          }
          
          userId = signupData.user.id;
          console.log("User created successfully:", userId);
          
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (authError: any) {
        // If the error mentions permission issues or is a 403, show specific message
        if (authError.message?.includes('not allowed') || authError.status === 403 || 
            authError.message?.includes('not_admin') || authError.message?.includes('permission denied')) {
          console.error("Permission error:", authError);
          throw new Error("Brak wymaganych uprawnień administratora Supabase do zarządzania użytkownikami. Skontaktuj się z administratorem systemu.");
        }
        
        console.error("Failed first attempt, trying admin API...", authError);
        
        try {
          console.log("Attempting to create user with admin API...");
          const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name: memberName }
          });
          
          if (createError) {
            console.error("Admin user creation error:", createError);
            
            // If the error is about permission
            if (createError.message?.includes('not allowed') || createError.status === 403 ||
                createError.message?.includes('not_admin') || createError.message?.includes('permission denied')) {
              throw new Error("Twoje konto nie posiada uprawnień administratora Supabase do tworzenia użytkowników. Użyj istniejącego adresu email lub skontaktuj się z administratorem systemu.");
            }
            
            throw createError;
          }
          
          if (!userData.user) {
            throw new Error("Failed to create user account with admin API");
          }
          
          userId = userData.user.id;
          console.log("User created successfully with admin API:", userId);
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (adminError: any) {
          console.error("Failed to create user with admin API:", adminError);
          
          // If the error indicates the user already exists
          if (adminError.message?.includes('already exists')) {
            throw new Error("Użytkownik o podanym adresie email już istnieje w systemie. Spróbuj zalogować się na to konto lub użyj innego adresu email.");
          }
          
          throw new Error(adminError.message || "Nie można utworzyć konta użytkownika. Sprawdź swoje uprawnienia lub spróbuj inny adres email.");
        }
      }
      
      if (userId) {
        // Only insert into profiles if this is a new user
        if (isNewUser) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: email
            });
            
          if (profileError) {
            console.error("Error creating profile:", profileError);
            if (profileError.code !== '23505') { // Not a duplicate key error
              throw profileError;
            }
          }
        }

        if (role !== 'user') {
          const { error: roleError } = await supabase
            .from('user_roles')
            .upsert({
              user_id: userId,
              role: role
            }, {
              onConflict: 'user_id'
            });
            
          if (roleError) {
            console.error("Error setting role:", roleError);
            throw roleError;
          }
        }
      }
      
      localStorage.setItem('currentUserEmail', email);
      
      return { 
        email, 
        isNewUser, 
        passwordUpdated: true 
      };
    } catch (error: any) {
      console.error('Error creating user and setting role:', error);
      throw error;
    }
  };

  return {
    createUserAndSetRole
  };
};
