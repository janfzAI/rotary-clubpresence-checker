
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
    
    // Find the matching user with improved precision
    const matchingUser = findBestMatchingUser(member);
    
    if (matchingUser) {
      console.log(`Found matching user for ${member.name}:`, matchingUser.email);
      setMemberEmail(matchingUser.email);
      setSelectedRole(matchingUser.role);
    } else {
      console.log("No matching user found for member:", member.name);
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

  // New improved function to find the best matching user
  const findBestMatchingUser = (member: Member) => {
    console.log(`Finding best matching user for: ${member.name} with ID: ${member.id}`);
    
    if (!member || !users || users.length === 0) {
      return null;
    }
    
    // 1. First try exact ID match (most reliable)
    const exactIdMatch = users.find(user => user.id === member.id.toString());
    if (exactIdMatch) {
      console.log(`Found exact ID match for ${member.name}:`, exactIdMatch.email);
      return exactIdMatch;
    }
    
    // Special case handling for specific known conflicts
    if (member.name.includes("Meissinger")) {
      console.log("Special handling for Meissinger");
      // For Meissinger, find any user with "meissinger" in email, NOT "dokowski"
      const meissingerUser = users.find(user => {
        const email = user.email.toLowerCase();
        return email.includes("meissinger") || 
              (email.includes("meisinger") && !email.includes("dokowski"));
      });
      
      if (meissingerUser) {
        console.log("Found specific match for Meissinger:", meissingerUser.email);
        return meissingerUser;
      }
    } 
    
    if (member.name.includes("Dokowski")) {
      console.log("Special handling for Dokowski");
      // For Dokowski, find user with "dokowski" in email
      const dokowskiUser = users.find(user => 
        user.email.toLowerCase().includes("dokowski")
      );
      
      if (dokowskiUser) {
        console.log("Found specific match for Dokowski:", dokowskiUser.email);
        return dokowskiUser;
      }
    }
    
    // 2. Try to match by full name with high precision
    const fullName = member.name.toLowerCase();
    const nameParts = fullName.split(/\s+/);
    
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      
      console.log(`Looking for match with firstName: ${firstName}, lastName: ${lastName}`);
      
      // Try to find a user with both first name and last name in email
      const fullNameMatch = users.find(user => {
        const email = user.email.toLowerCase();
        return email.includes(firstName) && email.includes(lastName);
      });
      
      if (fullNameMatch) {
        console.log(`Found match with both first and last name for ${fullName}:`, fullNameMatch.email);
        return fullNameMatch;
      }
      
      // Try to find user with last name (more unique than first name)
      if (lastName.length >= 3) { // Only if last name is reasonably long
        const lastNameMatch = users.find(user => 
          user.email.toLowerCase().includes(lastName)
        );
        
        if (lastNameMatch) {
          console.log(`Found match with last name for ${fullName}:`, lastNameMatch.email);
          return lastNameMatch;
        }
      }
    }
    
    // 3. Fallback to first name match if reasonably unique
    if (nameParts.length > 0 && nameParts[0].length >= 3) {
      const firstName = nameParts[0];
      
      const firstNameMatches = users.filter(user => 
        user.email.toLowerCase().includes(firstName)
      );
      
      if (firstNameMatches.length === 1) {
        console.log(`Found unique first name match for ${fullName}:`, firstNameMatches[0].email);
        return firstNameMatches[0];
      }
    }
    
    console.log(`No reliable match found for ${member.name}`);
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
