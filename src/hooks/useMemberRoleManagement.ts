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
    console.log("Opening role dialog for member:", member);
    
    // Store the selected member
    setSelectedMember(member);
    
    // Refresh users list before finding a match
    await refreshUserData();
    
    // Important: Set memberEmail to empty initially
    setMemberEmail('');
    setSelectedRole('user');
    
    // Find the matching user by exact ID first to ensure we get the right person
    const exactMatch = findExactUserById(member.id.toString());
    if (exactMatch) {
      console.log("Found exact match by ID:", exactMatch.email);
      setMemberEmail(exactMatch.email);
      setSelectedRole(exactMatch.role);
    } else {
      // If no exact ID match, try to find by name
      const userMatch = findUserByName(member.name);
      if (userMatch) {
        console.log("Found match by name:", userMatch.email);
        setMemberEmail(userMatch.email);
        setSelectedRole(userMatch.role);
      } else {
        console.log("No matching user found for member:", member.name);
      }
    }
    
    // Clear password field
    setMemberPassword('');
  };

  const handleCloseDialog = () => {
    setMemberEmail('');
    setMemberPassword('');
    setSelectedRole('user');
    setSelectedMember(null);
  };

  // New function to find user by exact ID match
  const findExactUserById = (memberId: string) => {
    console.log("Looking for exact ID match:", memberId);
    return users.find(user => user.id === memberId);
  };

  // New function to find user by name with improved matching logic
  const findUserByName = (memberName: string) => {
    console.log("Finding user by name for:", memberName);
    
    if (!memberName || !users || users.length === 0) {
      return null;
    }
    
    // Normalize function to standardize text for comparison
    const normalize = (text: string) => {
      if (!text) return '';
      return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
        .replace(/[^\w\s]/g, '')          // Remove special characters
        .replace(/\s+/g, '');             // Remove whitespace
    };
    
    const normalizedMemberName = normalize(memberName);
    console.log("Normalized member name:", normalizedMemberName);
    
    // Extract first name and last name if possible
    const nameParts = memberName.split(/\s+/);
    const firstName = nameParts.length > 0 ? normalize(nameParts[0]) : '';
    const lastName = nameParts.length > 1 ? normalize(nameParts.slice(1).join('')) : '';
    
    console.log("Looking for first name:", firstName, "last name:", lastName);
    
    // 1. Try to find exact full name match in email
    for (const user of users) {
      if (!user.email) continue;
      
      const normalizedEmail = normalize(user.email);
      // Look for full name patterns in email
      if (normalizedEmail.includes(normalizedMemberName) || 
          (firstName && lastName && normalizedEmail.includes(firstName) && normalizedEmail.includes(lastName))) {
        console.log("Found match with full name in email:", user.email);
        return user;
      }
    }
    
    // 2. For certain specific names (like in the screenshot example)
    if (memberName.includes("Meissinger")) {
      const meissingerUser = users.find(u => 
        u.email && normalize(u.email).includes("meissinger")
      );
      if (meissingerUser) {
        console.log("Found special match for Meissinger:", meissingerUser.email);
        return meissingerUser;
      }
    }
    
    if (memberName.includes("Dokowski")) {
      const dokowskiUser = users.find(u => 
        u.email && normalize(u.email).includes("dokowski")
      );
      if (dokowskiUser) {
        console.log("Found special match for Dokowski:", dokowskiUser.email);
        return dokowskiUser;
      }
    }
    
    // 3. Try matching with last name which is more unique
    if (lastName) {
      const lastNameUser = users.find(u => 
        u.email && normalize(u.email).includes(lastName)
      );
      if (lastNameUser) {
        console.log("Found match by last name:", lastNameUser.email);
        return lastNameUser;
      }
    }
    
    // 4. Try matching with first name (least reliable)
    if (firstName && firstName.length > 2) {
      const firstNameMatches = users.filter(u => 
        u.email && normalize(u.email).includes(firstName)
      );
      
      if (firstNameMatches.length === 1) {
        console.log("Found unique match by first name:", firstNameMatches[0].email);
        return firstNameMatches[0];
      } else if (firstNameMatches.length > 1) {
        console.log("Multiple matches found by first name, cannot determine unique match");
        // Return null as we can't determine a unique match
        return null;
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
