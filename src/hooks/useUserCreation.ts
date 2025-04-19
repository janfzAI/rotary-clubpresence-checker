
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
          throw signupError;
        }
        
        if (!signupData.user) {
          throw new Error("Failed to create user account");
        }
        
        userId = signupData.user.id;
        console.log("User created successfully:", userId);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (authError) {
        console.error("Failed to create user via signup:", authError);
        
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
            throw createError;
          }
          
          if (!userData.user) {
            throw new Error("Failed to create user account with admin API");
          }
          
          userId = userData.user.id;
          console.log("User created successfully with admin API:", userId);
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (adminError) {
          console.error("Failed to create user with admin API:", adminError);
          throw new Error("Nie można utworzyć konta użytkownika. Sprawdź swoje uprawnienia lub spróbuj inny adres email.");
        }
      }
      
      if (userId) {
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
    } catch (error) {
      console.error('Error creating user and setting role:', error);
      throw error;
    }
  };

  return {
    createUserAndSetRole
  };
};
