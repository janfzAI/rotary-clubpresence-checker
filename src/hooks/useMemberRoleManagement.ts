
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useUserRoles } from "@/hooks/useUserRoles";
import type { AppRole } from "@/types/userRoles";

interface Member {
  id: number;
  name: string;
  active?: boolean;
}

export const useMemberRoleManagement = () => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailChangeTimestamp, setEmailChangeTimestamp] = useState(0);
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState(0);
  
  const { toast } = useToast();
  const { users, handleMemberRoleChange, fetchUsers } = useUserRoles();

  // Enhanced refresh function with timestamp tracking and better error handling
  const refreshUserData = useCallback(async () => {
    console.log("Refreshing user data in useMemberRoleManagement");
    try {
      await fetchUsers();
      setLastRefreshTimestamp(Date.now());
      return true;
    } catch (error) {
      console.error("Error refreshing user data:", error);
      return false;
    }
  }, [fetchUsers]);

  // Refresh user data when email changes
  useEffect(() => {
    if (emailChangeTimestamp > 0) {
      console.log("Email change detected, refreshing user data", emailChangeTimestamp);
      refreshUserData();
    }
  }, [emailChangeTimestamp, refreshUserData]);

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
        const existingUser = users.find(u => u.email.toLowerCase() === memberEmail.toLowerCase());
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
        
        // Refresh user data after role change
        await refreshUserData();
      }
      
      handleCloseDialog();
    } catch (error: any) {
      console.error("Error managing user:", error);
      
      // Bardziej szczegółowa obsługa błędów
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

  const handleOpenRoleDialog = async (member: Member) => {
    console.log("Opening role dialog for member:", member.name);
    
    // Refresh users list before finding a match
    await refreshUserData();
    
    setSelectedMember(member);
    const matchedUser = findBestMatchingUser(member.name);
    
    if (matchedUser) {
      console.log("Found matching user for member:", matchedUser.email);
      setMemberEmail(matchedUser.email);
      setSelectedRole(matchedUser.role);
    } else {
      console.log("No matching user found for member:", member.name);
      setMemberEmail('');
      setSelectedRole('user');
    }
    
    setMemberPassword('');
  };

  const handleCloseDialog = () => {
    setMemberEmail('');
    setMemberPassword('');
    setSelectedRole('user');
    setSelectedMember(null);
  };

  // Improved user matching algorithm with better logging
  const findBestMatchingUser = (memberName: string) => {
    console.log("Finding best matching user for:", memberName);
    console.log("Current users:", users.map(u => ({ email: u.email, timestamp: lastRefreshTimestamp })));
    
    if (!memberName || !users || users.length === 0) {
      console.log("No member name provided or no users available");
      return null;
    }
    
    const normalize = (text: string) => {
      if (!text) return '';
      return text.toLowerCase().replace(/\s+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };
    
    const normalizedName = normalize(memberName);
    console.log("Normalized member name:", normalizedName);
    
    // First priority: Exact match by name in email (case insensitive)
    const userName = memberName.toLowerCase().replace(/\s+/g, '.');
    const userNameNoSpace = memberName.toLowerCase().replace(/\s+/g, '');
    
    for (const user of users) {
      if (!user.email) continue;
      const normalizedEmail = normalize(user.email);
      if (normalizedEmail.includes(userName) || normalizedEmail.includes(userNameNoSpace)) {
        console.log("Found exact match by name in email:", user.email);
        return user;
      }
    }
    
    // Handling for "Jan Jurga" specifically
    if (memberName.toLowerCase().includes("jan jurga")) {
      const janUser = users.find(u => 
        u.email && (u.email.toLowerCase().includes("jan") || u.email.toLowerCase().includes("jurga"))
      );
      if (janUser) {
        console.log("Found special match for Jan Jurga:", janUser.email);
        return janUser;
      }
    }
    
    // Second priority: Email includes normalized name
    for (const user of users) {
      if (!user.email) continue;
      const normalizedEmail = normalize(user.email);
      if (normalizedEmail.includes(normalizedName) || normalizedName.includes(normalizedEmail)) {
        console.log("Found match by email inclusion:", user.email);
        return user;
      }
    }
    
    // Third priority: Name parts matching
    const nameParts = memberName.toLowerCase().split(/\s+/);
    console.log("Name parts for matching:", nameParts);
    
    for (const user of users) {
      if (!user.email) continue;
      for (const part of nameParts) {
        if (part.length > 2 && normalize(user.email).includes(normalize(part))) {
          console.log("Found match by name part:", part, "in email:", user.email);
          return user;
        }
      }
    }
    
    console.log("No matching user found after all attempts");
    return null;
  };

  const notifyEmailChanged = () => {
    console.log("Email change notification received");
    setEmailChangeTimestamp(Date.now());
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
    fetchUsers,
    refreshUserData,
    notifyEmailChanged,
    lastRefreshTimestamp
  };
};
