import { useState, useEffect } from 'react';
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
  
  const { toast } = useToast();
  const { users, handleMemberRoleChange, fetchUsers } = useUserRoles();

  useEffect(() => {
    if (emailChangeTimestamp > 0) {
      fetchUsers();
    }
  }, [emailChangeTimestamp, fetchUsers]);

  const handleRoleChangeSubmit = async () => {
    if (!memberEmail || !selectedRole || !selectedMember) {
      toast({
        title: "Error",
        description: "Please provide an email and select a role",
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
        
        let message = `Successfully ${isNewUser ? 'created user' : 'changed user role'} ${memberEmail} to ${selectedRole}`;
        if (memberPassword && result.passwordUpdated) {
          message += isNewUser ? ' with the provided password' : ' and updated password';
        } else if (memberPassword && result.passwordUpdated === false) {
          message += '. Note: Failed to update password (administrator privileges required).';
        }
        
        toast({
          title: isNewUser ? "User Created" : "Permissions Changed",
          description: message
        });
        
        await fetchUsers();
      }
      
      handleCloseDialog();
    } catch (error: any) {
      console.error("Error managing user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change user permissions",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRoleDialog = async (member: Member) => {
    console.log("Opening role dialog for member:", member.name);
    
    await fetchUsers();
    
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

  const findBestMatchingUser = (memberName: string) => {
    console.log("Finding best matching user for:", memberName);
    console.log("Current users:", users.map(u => u.email));
    
    const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    const normalizedName = normalize(memberName);
    console.log("Normalized member name:", normalizedName);
    
    for (const user of users) {
      const normalizedEmail = normalize(user.email);
      console.log("Checking user email:", user.email, "normalized:", normalizedEmail);
      
      if (normalizedEmail.includes(normalizedName) || normalizedName.includes(normalizedEmail)) {
        console.log("Found match by email inclusion:", user.email);
        return user;
      }
    }
    
    const nameParts = memberName.toLowerCase().split(/\s+/);
    console.log("Name parts for matching:", nameParts);
    
    for (const user of users) {
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
    notifyEmailChanged
  };
};
