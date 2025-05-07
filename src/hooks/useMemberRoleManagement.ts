
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
  
  // New state to store explicit member to email mappings
  const [memberEmailMappings, setMemberEmailMappings] = useState<Record<string, string>>({
    // Default mappings for known problematic users
    "Krzysztof Meissinger": "krzysztof.meissinger@example.com",
    "Krzysztof Dokowski": "krzysztof.dokowski@example.com"
  });
  
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

  // Add function to save member-email mappings
  const saveMemberEmailMapping = (memberName: string, email: string) => {
    console.log(`Saving mapping for ${memberName}: ${email}`);
    setMemberEmailMappings(prev => ({
      ...prev,
      [memberName]: email
    }));
    
    // Store in localStorage for persistence
    try {
      const existingMappings = JSON.parse(localStorage.getItem('memberEmailMappings') || '{}');
      const updatedMappings = { ...existingMappings, [memberName]: email };
      localStorage.setItem('memberEmailMappings', JSON.stringify(updatedMappings));
    } catch (error) {
      console.error("Error saving member email mapping to localStorage:", error);
    }
  };

  // Load mappings from localStorage on initialization
  useEffect(() => {
    try {
      const savedMappings = localStorage.getItem('memberEmailMappings');
      if (savedMappings) {
        const parsedMappings = JSON.parse(savedMappings);
        setMemberEmailMappings(prev => ({
          ...prev,
          ...parsedMappings
        }));
        console.log("Loaded member-email mappings from localStorage:", parsedMappings);
      }
    } catch (error) {
      console.error("Error loading member email mappings from localStorage:", error);
    }
  }, []);

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
      const memberName = selectedMember.name;
      
      // Save mapping when submitting a role change
      saveMemberEmailMapping(memberName, memberEmail);
      
      const result = await handleMemberRoleChange(
        memberName,
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
    
    // Reset fields
    setMemberEmail('');
    setSelectedRole('user');
    
    // Check if we have a saved mapping for this member
    const memberName = member.name;
    const savedEmail = memberEmailMappings[memberName];
    
    if (savedEmail) {
      console.log(`Found saved email mapping for ${memberName}:`, savedEmail);
      setMemberEmail(savedEmail);
      
      // Find matching user to get their role
      const matchingUser = users.find(u => 
        u.email.toLowerCase() === savedEmail.toLowerCase()
      );
      
      if (matchingUser) {
        console.log(`User found with matching email. Setting role to ${matchingUser.role}`);
        setSelectedRole(matchingUser.role);
      } else {
        console.log("No user found with this email yet. Setting default role 'user'");
        setSelectedRole('user');
      }
    } else {
      // If no mapping exists, fallback to the old method to find a potential match
      console.log("No saved mapping found. Looking for potential matches...");
      const matchingUser = findBestMatchingUser(member);
      
      if (matchingUser) {
        console.log(`Found potential matching user for ${member.name}:`, matchingUser.email);
        setMemberEmail(matchingUser.email);
        setSelectedRole(matchingUser.role);
        
        // Save this mapping for future use
        saveMemberEmailMapping(memberName, matchingUser.email);
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
    
    // Special handling for specific cases
    if (member.name === "Krzysztof Meissinger") {
      console.log("Special handling for Meissinger");
      const meissingerUser = users.find(user => 
        user.email.toLowerCase().includes("meissinger") || 
        (user.email.toLowerCase().includes("meisinger") && !user.email.toLowerCase().includes("dokowski"))
      );
      
      if (meissingerUser) {
        console.log("Found specific match for Meissinger:", meissingerUser.email);
        return meissingerUser;
      }
    }
    
    if (member.name === "Krzysztof Dokowski") {
      console.log("Special handling for Dokowski");
      const dokowskiUser = users.find(user => 
        user.email.toLowerCase().includes("dokowski")
      );
      
      if (dokowskiUser) {
        console.log("Found specific match for Dokowski:", dokowskiUser.email);
        return dokowskiUser;
      }
    }
    
    // 2. Try name-based matching as before
    const fullName = member.name.toLowerCase();
    const nameParts = fullName.split(/\s+/);
    
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      
      // Try to find a user with both first name and last name in email
      const fullNameMatch = users.find(user => {
        const email = user.email.toLowerCase();
        return email.includes(firstName) && email.includes(lastName);
      });
      
      if (fullNameMatch) {
        return fullNameMatch;
      }
      
      // Try to find user with last name
      if (lastName.length >= 3) {
        const lastNameMatch = users.find(user => 
          user.email.toLowerCase().includes(lastName)
        );
        
        if (lastNameMatch) {
          return lastNameMatch;
        }
      }
    }
    
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
    lastRefreshTimestamp,
    // New functions for working with email mappings
    saveMemberEmailMapping,
    memberEmailMappings
  };
};
