
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
    const matchedEmail = findEmailMatch(member.name, users.map(u => u.email));
    
    if (matchedEmail) {
      console.log("Found matching user email:", matchedEmail);
      const user = getUserByEmail(matchedEmail);
      setMemberEmail(matchedEmail);
      setSelectedRole(user?.role || 'user');
    } else {
      console.log("No matching user found for member:", member.name);
      setMemberEmail('');
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
    
    setIsSubmitting(true);

    try {
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
      
      if (error.message && error.message.includes('not_admin')) {
        toast({
          title: "Brak uprawnień",
          description: "Twoje konto nie posiada uprawnień administratora Supabase do wykonania tej operacji. Skontaktuj się z administratorem systemu.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Błąd",
          description: error instanceof Error ? error.message : "Nie udało się zmienić uprawnień użytkownika",
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
