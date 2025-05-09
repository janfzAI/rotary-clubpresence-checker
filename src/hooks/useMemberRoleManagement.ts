
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
  
  // State to store explicit member to email mappings using member ID as key
  const [memberEmailMappings, setMemberEmailMappings] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const { users, handleMemberRoleChange, fetchUsers, getRoleByEmail } = useUserRoles();

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

  // Add function to save member-email mappings using member ID as key
  const saveMemberEmailMapping = (member: Member, email: string) => {
    if (!member || !member.id) {
      console.error("Cannot save mapping: Invalid member or missing ID");
      return;
    }
    
    const memberId = String(member.id); // Convert to string for consistent storage
    console.log(`Saving mapping for member ID ${memberId} (${member.name}): ${email}`);
    
    setMemberEmailMappings(prev => ({
      ...prev,
      [memberId]: email
    }));
    
    // Store in localStorage for persistence
    try {
      const existingMappings = JSON.parse(localStorage.getItem('memberEmailMappings') || '{}');
      const updatedMappings = { ...existingMappings, [memberId]: email };
      localStorage.setItem('memberEmailMappings', JSON.stringify(updatedMappings));
    } catch (error) {
      console.error("Error saving member email mapping to localStorage:", error);
    }
  };

  // Helper function to get email by member ID
  const getEmailByMemberId = (memberId: string | number): string | undefined => {
    const id = String(memberId);
    return memberEmailMappings[id];
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
      const memberId = String(selectedMember.id);
      const memberName = selectedMember.name;
      
      // Save mapping using member ID when submitting a role change
      saveMemberEmailMapping(selectedMember, memberEmail);
      
      // Check current role from the database before making changes
      const currentRole = getRoleByEmail(memberEmail);
      console.log(`Current role for ${memberEmail} before change: ${currentRole}`);
      
      console.log(`Attempting role change for ID ${memberId} (${memberName}) with email ${memberEmail} to ${selectedRole}`);
      
      const result = await handleMemberRoleChange(
        memberName,
        memberEmail,
        selectedRole,
        memberPassword || undefined
      );
      
      if (result) {
        const existingUser = users.find(u => u.email.toLowerCase() === memberEmail.toLowerCase());
        const isNewUser = !existingUser;
        
        // Use member name in the success message instead of email
        let message = `Pomyślnie ${isNewUser ? 'utworzono użytkownika' : 'zmieniono rolę użytkownika'} ${memberName} na ${selectedRole}`;
        if (memberPassword && result.passwordUpdated) {
          message += isNewUser ? ' z podanym hasłem' : ' i zaktualizowano hasło';
        } else if (memberPassword && result.passwordUpdated === false) {
          message += '. Uwaga: Nie udało się zaktualizować hasła (wymagane uprawnienia administratora).';
        }
        
        toast({
          title: isNewUser ? "Utworzono użytkownika" : "Zmieniono uprawnienia",
          description: message
        });
        
        // Force full refresh of user data after role change with multiple attempts
        setTimeout(async () => {
          console.log(`Forcing refresh after role change for ${memberName}`);
          await refreshUserData();
          
          // Do a second refresh after a longer delay to ensure database is fully updated
          setTimeout(async () => {
            console.log(`Secondary refresh for ${memberName} to ensure data is current`);
            await refreshUserData();
          }, 2000);
        }, 1000);
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
    
    // Check if we have a saved mapping for this member using ID
    const memberId = String(member.id);
    const savedEmail = getEmailByMemberId(memberId);
    
    if (savedEmail) {
      console.log(`Found saved email mapping for member ID ${memberId} (${member.name}):`, savedEmail);
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
      // If no mapping exists by ID, try to find a matching user
      console.log(`No saved mapping found for ID ${memberId}. Looking for potential matches...`);
      const matchingUser = findBestMatchingUser(member);
      
      if (matchingUser) {
        console.log(`Found potential matching user for ${member.id} (${member.name}):`, matchingUser.email);
        setMemberEmail(matchingUser.email);
        setSelectedRole(matchingUser.role);
        
        // Save this mapping for future use with member ID
        saveMemberEmailMapping(member, matchingUser.email);
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

  // Improved function to find the best matching user
  const findBestMatchingUser = (member: Member) => {
    console.log(`Finding best matching user for member ID: ${member.id}, name: ${member.name}`);
    
    if (!member || !users || users.length === 0) {
      return null;
    }
    
    // Try to find a user with both first name and last name in email
    const fullName = member.name.toLowerCase();
    const nameParts = fullName.split(/\s+/);
    
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      
      // First try to find a user with both first name and last name in email
      const fullNameMatch = users.find(user => {
        const email = user.email.toLowerCase();
        return email.includes(firstName) && email.includes(lastName);
      });
      
      if (fullNameMatch) {
        console.log(`Found full name match for ${member.name}:`, fullNameMatch.email);
        return fullNameMatch;
      }
    }
    
    // No matches found
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
    // Functions for working with email mappings
    saveMemberEmailMapping,
    memberEmailMappings,
    getEmailByMemberId
  };
};
