
import { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useUserData } from './useUserData';
import { useRoleDialogState } from './useRoleDialogState';
import { findEmailMatch } from '@/utils/emailMatching';
import { useUserRoles } from './useUserRoles';
import type { Member } from '@/types/members';

export const useMemberRoleManagement = () => {
  const { toast } = useToast();
  const { users, refreshUserData, lastRefreshTimestamp, getUserByEmail } = useUserData();
  const { handleMemberRoleChange } = useUserRoles();
  const {
    selectedMember,
    selectedRole,
    memberEmail,
    memberPassword,
    isSubmitting,
    emailChangeTimestamp,
    setSelectedMember,
    setSelectedRole,
    setMemberEmail,
    setMemberPassword,
    setIsSubmitting,
    handleCloseDialog,
    notifyEmailChanged
  } = useRoleDialogState();

  // Only refresh when email changes
  useEffect(() => {
    if (emailChangeTimestamp > 0) {
      console.log("Email change detected, refreshing user data", emailChangeTimestamp);
      refreshUserData();
    }
  }, [emailChangeTimestamp, refreshUserData]);

  const handleOpenRoleDialog = async (member: Member) => {
    console.log("Opening role dialog for member:", member.name);
    
    // Don't refresh data every time, only if it's been more than 10 seconds since last refresh
    const currentTime = Date.now();
    if (currentTime - lastRefreshTimestamp > 10000) {
      await refreshUserData();
    }
    
    setSelectedMember(member);
    
    // Special case for Maciej Krzeptowski
    if (member.name.toLowerCase().includes("maciej") && member.name.toLowerCase().includes("krzeptowski")) {
      const maciejEmail = users.find(u => 
        u.email && u.email.toLowerCase().includes("maciej") && 
        (u.email.toLowerCase().includes("krzeptowski") || u.email.toLowerCase().includes("krzept"))
      )?.email;
      
      if (maciejEmail) {
        console.log("Found email for Maciej Krzeptowski:", maciejEmail);
        const user = getUserByEmail(maciejEmail);
        setMemberEmail(maciejEmail);
        setSelectedRole(user?.role || 'user');
        setMemberPassword('');
        return;
      }
    }
    
    // Special case for Krzysztof Dokowski
    if (member.name.toLowerCase().includes("krzysztof") && member.name.toLowerCase().includes("dokowski")) {
      const krzysztofEmail = users.find(u => 
        u.email && u.email.toLowerCase().includes("krzysztof") && 
        u.email.toLowerCase().includes("dokowski")
      )?.email;
      
      if (krzysztofEmail) {
        console.log("Found email for Krzysztof Dokowski:", krzysztofEmail);
        const user = getUserByEmail(krzysztofEmail);
        setMemberEmail(krzysztofEmail);
        setSelectedRole(user?.role || 'user');
        setMemberPassword('');
        return;
      }
      
      // Suggest default email based on name if no match found
      const suggestedEmail = `krzysztof.dokowski@example.com`;
      console.log("No email found for Krzysztof Dokowski, suggesting:", suggestedEmail);
      setMemberEmail(suggestedEmail);
      setSelectedRole('user');
      setMemberPassword('');
      return;
    }
    
    const matchedEmail = findEmailMatch(member.name, users.map(u => u.email));
    
    if (matchedEmail) {
      console.log("Found matching user email:", matchedEmail);
      const user = getUserByEmail(matchedEmail);
      setMemberEmail(matchedEmail);
      setSelectedRole(user?.role || 'user');
    } else {
      console.log("No matching user found for member:", member.name);
      // Create suggested email based on name
      const nameParts = member.name.split(' ');
      let suggestedEmail = '';
      
      if (nameParts.length >= 2) {
        const firstName = nameParts[0].toLowerCase();
        const lastName = nameParts[nameParts.length - 1].toLowerCase();
        suggestedEmail = `${firstName}.${lastName}@example.com`;
      } else {
        suggestedEmail = `${member.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
      }
      
      setMemberEmail(suggestedEmail);
      setSelectedRole('user');
    }
    
    setMemberPassword('');
  };

  const handleRoleChangeSubmit = async () => {
    if (!memberEmail || !selectedRole || !selectedMember) {
      toast({
        title: "Błąd",
        description: "Proszę podać adres email i wybrać rolę",
        variant: "destructive"
      });
      return;
    }
    
    // For new users, ensure password is provided and meets minimum requirements
    const existingUser = users.find(u => u.email.toLowerCase() === memberEmail.toLowerCase());
    if (!existingUser && (!memberPassword || memberPassword.length < 6)) {
      toast({
        title: "Błąd",
        description: "Hasło dla nowego użytkownika musi mieć minimum 6 znaków",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      console.log(`Submitting role change for ${selectedMember.name} with email ${memberEmail} and role ${selectedRole}`);
      
      const result = await handleMemberRoleChange(
        selectedMember.name,
        memberEmail,
        selectedRole,
        memberPassword || undefined
      );
      
      if (result) {
        const existingUser = getUserByEmail(memberEmail);
        const isNewUser = !existingUser;
        
        let message = `Pomyślnie ${isNewUser ? 'utworzono użytkownika' : 'zmieniono rolę użytkownika'} ${memberEmail} na ${selectedRole}`;
        if (memberPassword && result.passwordUpdated) {
          message += isNewUser ? ' z podanym hasłem' : ' i zaktualizowano hasło';
        } else if (memberPassword && result.passwordUpdated === false) {
          message += '. Uwaga: Nie udało się zaktualizować hasła (wymagane uprawnienia administratora).';
        }
        
        toast({
          title: isNewUser ? "Utworzono użytkownika" : "Zmieniono uprawnienia",
          description: message
        });
        
        await refreshUserData();
      }
      
      handleCloseDialog();
    } catch (error: any) {
      console.error("Error managing user:", error);
      
      // Handle specific error cases
      let errorMessage = error.message || "Nie udało się zmienić uprawnień użytkownika";
      
      // Check for password validation errors
      if (errorMessage.includes('password') && errorMessage.includes('short')) {
        errorMessage = "Hasło jest za krótkie. Musi mieć minimum 6 znaków.";
      }
      
      // Check for permission errors
      if (errorMessage.includes('not_admin') || errorMessage.includes('permission denied') ||
          errorMessage.includes('permission') || errorMessage.includes('uprawnień')) {
        toast({
          title: "Brak uprawnień",
          description: "Twoje konto nie posiada uprawnień administratora Supabase do wykonania tej operacji. Skontaktuj się z administratorem systemu.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Błąd",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    selectedMember,
    selectedRole,
    memberEmail,
    memberPassword,
    isSubmitting,
    users,
    handleRoleChangeSubmit,
    handleOpenRoleDialog,
    handleCloseDialog,
    setMemberEmail,
    setMemberPassword,
    setSelectedRole,
    fetchUsers: refreshUserData,
    refreshUserData,
    notifyEmailChanged,
    lastRefreshTimestamp
  };
};
