
import { useState } from 'react';
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
  
  const { toast } = useToast();
  const { users, handleMemberRoleChange, fetchUsers } = useUserRoles();

  const handleRoleChangeSubmit = async () => {
    if (!memberEmail || !selectedRole || !selectedMember) {
      toast({
        title: "Błąd",
        description: "Proszę podać email i wybrać rolę",
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
        } else if (memberPassword && !result.passwordUpdated) {
          message += '. Uwaga: Nie udało się zaktualizować hasła (wymagane uprawnienia administratora).';
        }
        
        toast({
          title: isNewUser ? "Utworzono użytkownika" : "Zmieniono uprawnienia",
          description: message
        });
        
        fetchUsers();
      }
      
      handleCloseDialog();
    } catch (error: any) {
      console.error("Error managing user:", error);
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Nie udało się zmienić uprawnień użytkownika",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRoleDialog = (member: Member) => {
    setSelectedMember(member);
    const matchedUser = findBestMatchingUser(member.name);
    
    if (matchedUser) {
      setMemberEmail(matchedUser.email);
      setSelectedRole(matchedUser.role);
    } else {
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
    const normalizedName = memberName.toLowerCase().replace(/\s+/g, '');
    
    for (const user of users) {
      const normalizedEmail = user.email.toLowerCase().replace(/\s+/g, '');
      if (normalizedEmail.includes(normalizedName) || normalizedName.includes(normalizedEmail)) {
        return user;
      }
    }
    
    const nameParts = memberName.toLowerCase().split(/\s+/);
    for (const user of users) {
      for (const part of nameParts) {
        if (part.length > 2 && user.email.toLowerCase().includes(part)) {
          return user;
        }
      }
    }
    
    return null;
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
    setSelectedRole
  };
};
