import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useMemberRoleManagement } from "@/hooks/useMemberRoleManagement";
import { MemberListItem } from './members/MemberListItem';
import { MemberRoleDialog } from './members/MemberRoleDialog';
import { MemberEmailEdit } from './members/dialog/MemberEmailEdit';
import { supabase } from "@/integrations/supabase/client";

interface Member {
  id: number;
  name: string;
  active?: boolean;
}

interface MembersManagementProps {
  members: Member[];
  onAddMember: (name: string) => void;
  onRemoveMember: (id: number) => void;
  onToggleActive: (id: number) => void;
}

export const MembersManagement = ({ 
  members,
  onAddMember,
  onRemoveMember,
  onToggleActive
}: MembersManagementProps) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [emailEditMember, setEmailEditMember] = useState<{ id: number; name: string } | null>(null);
  const [currentEmailForEdit, setCurrentEmailForEdit] = useState<string>('');
  const { toast } = useToast();
  
  const {
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
    refreshUserData,
    notifyEmailChanged,
    lastRefreshTimestamp
  } = useMemberRoleManagement();

  useEffect(() => {
    console.log("MembersManagement: Initial user data refresh");
    refreshUserData();
  }, [refreshUserData]);

  useEffect(() => {
    if (lastRefreshTimestamp > 0) {
      console.log("MembersManagement: User data refreshed at", new Date(lastRefreshTimestamp).toISOString());
    }
  }, [lastRefreshTimestamp]);

  const findUserRole = (memberName: string, memberId: number) => {
    console.log(`Finding role for member: ${memberName} (ID: ${memberId}), available users: ${users.length}`);
    
    const memberFullName = memberName.toLowerCase().trim();
    
    const exactUserMatch = users.find(user => {
      if (!user.email) return false;
      
      const normalizedEmail = user.email.toLowerCase().trim();
      
      const nameParts = memberFullName.split(' ');
      if (nameParts.length < 2) return false;
      
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      
      return normalizedEmail.includes(firstName) && 
             normalizedEmail.includes(lastName);
    });
    
    if (exactUserMatch) {
      console.log(`Found exact match for ${memberName}: ${exactUserMatch.email} with role ${exactUserMatch.role}`);
      return exactUserMatch.role;
    }
    
    const partialMatch = users.find(user => {
      if (!user.email) return false;
      
      const normalizedEmail = user.email.toLowerCase().trim();
      const userName = memberFullName.replace(/\s+/g, '.');
      const userNameNoSpace = memberFullName.replace(/\s+/g, '');
      
      return normalizedEmail.includes(userName) || normalizedEmail.includes(userNameNoSpace);
    });
    
    if (partialMatch) {
      console.log(`Found partial match for ${memberName}: ${partialMatch.email} with role ${partialMatch.role}`);
      return partialMatch.role;
    }
    
    if (memberName.toLowerCase().includes("jan jurga")) {
      const janUser = users.find(u => 
        u.email && (u.email.toLowerCase().includes("jan") && u.email.toLowerCase().includes("jurga"))
      );
      if (janUser) {
        console.log(`Found special match for Jan Jurga: ${janUser.email} with role ${janUser.role}`);
        return janUser.role;
      }
    }
    
    console.log(`No role match found for ${memberName}`);
    return undefined;
  };

  const findCurrentEmailForMember = (memberName: string): string => {
    console.log(`Finding current email for member: ${memberName}`);
    
    if (!memberName || !users || users.length === 0) {
      console.log("No member name provided or no users available");
      return '';
    }
    
    if (memberName.toLowerCase().includes("jan jurga")) {
      const janUser = users.find(u => 
        u.email && (u.email.toLowerCase().includes("jan") || u.email.toLowerCase().includes("jurga"))
      );
      if (janUser && janUser.email) {
        console.log(`Found special match for Jan Jurga: ${janUser.email}`);
        return janUser.email;
      }
    }
    
    const normalizedMemberName = memberName.toLowerCase().trim();
    
    const exactUserMatch = users.find(user => {
      if (!user.email) return false;
      const normalizedEmail = user.email.toLowerCase().trim();
      const userName = normalizedMemberName.replace(/\s+/g, '.');
      const userNameNoSpace = normalizedMemberName.replace(/\s+/g, '');
      
      return normalizedEmail.includes(userName) || normalizedEmail.includes(userNameNoSpace);
    });
    
    if (exactUserMatch && exactUserMatch.email) {
      console.log(`Found exact email match for ${memberName}: ${exactUserMatch.email}`);
      return exactUserMatch.email;
    }
    
    const nameParts = memberName.split(' ');
    if (nameParts.length >= 2) {
      const firstName = nameParts[0].toLowerCase();
      const lastName = nameParts[nameParts.length - 1].toLowerCase();
      
      const matchedUser = users.find(user => {
        if (!user.email) return false;
        const normalizedEmail = user.email.toLowerCase();
        
        return normalizedEmail.startsWith(`${firstName}.${lastName}`) ||
               normalizedEmail.startsWith(`${lastName}.${firstName}`) ||
               normalizedEmail.startsWith(`${firstName}${lastName}`) ||
               normalizedEmail.startsWith(`${lastName}${firstName}`) ||
               normalizedEmail.startsWith(`${firstName[0]}${lastName}`) ||
               normalizedEmail.startsWith(`${lastName[0]}${firstName}`);
      });
      
      if (matchedUser && matchedUser.email) {
        console.log(`Found name-based email match for ${memberName}: ${matchedUser.email}`);
        return matchedUser.email;
      }
    }
    
    for (const user of users) {
      if (!user.email) continue;
      
      const userEmail = user.email.toLowerCase();
      const nameParts = memberName.toLowerCase().split(' ');
      
      for (const part of nameParts) {
        if (part.length > 2 && userEmail.includes(part)) {
          console.log(`Found part match for ${memberName}: ${user.email} (matched part: ${part})`);
          return user.email;
        }
      }
    }
    
    console.log(`No email found for member ${memberName}`);
    return '';
  };

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      onAddMember(newMemberName.trim());
      setNewMemberName('');
      toast({
        title: "Dodano nowego członka",
        description: `${newMemberName} został dodany do listy.`
      });
    }
  };

  const handleRemoveMember = (id: number, name: string) => {
    if (window.confirm(`Czy na pewno chcesz całkowicie usunąć ${name} z systemu? Ta operacja jest nieodwracalna.`)) {
      onRemoveMember(id);
      toast({
        title: "Usunięto członka",
        description: `${name} został całkowicie usunięty z systemu.`
      });
    }
  };

  const handleToggleActive = (id: number, name: string, isCurrentlyActive: boolean) => {
    onToggleActive(id);
    toast({
      title: isCurrentlyActive ? "Dezaktywowano członka" : "Aktywowano członka",
      description: `${name} został ${isCurrentlyActive ? 'dezaktywowany' : 'aktywowany'}.`
    });
  };

  const handleOpenEmailEdit = (member: { id: number; name: string }) => {
    console.log("Opening email edit for member:", member.name);
    
    refreshUserData().then(() => {
      const email = findCurrentEmailForMember(member.name);
      console.log("Current email found for email edit:", email);
      
      setEmailEditMember(member);
      setCurrentEmailForEdit(email);
    });
  };

  const handleEmailUpdate = async (newEmail: string) => {
    if (!emailEditMember) return;

    console.log(`Updating email for ${emailEditMember.name} to ${newEmail}`);
    
    const currentEmail = currentEmailForEdit;
    
    console.log('Current email from component state:', currentEmail);
    
    if (!currentEmail) {
      console.error('Nie znaleziono bieżącego adresu email');
      toast({
        title: "Błąd",
        description: "Nie znaleziono bieżącego adresu email użytkownika. Spróbuj przypisać adres email w zakładce Uprawnienia.",
        variant: "destructive"
      });
      return;
    }
    
    await refreshUserData();
    
    const matchedUser = users.find(user => 
      user.email && user.email.toLowerCase().trim() === currentEmail.toLowerCase().trim()
    );

    if (!matchedUser) {
      console.error('Nie znaleziono użytkownika o adresie email:', currentEmail);
      console.error('Dostępni użytkownicy:', users.map(u => u.email));
      
      toast({
        title: "Błąd",
        description: "Nie znaleziono użytkownika w systemie dla podanego adresu email. Spróbuj przypisać nowy adres w zakładce Uprawnienia.",
        variant: "destructive"
      });
      return;
    }

    console.log('Znaleziono użytkownika do aktualizacji:', matchedUser);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email: newEmail })
        .eq('id', matchedUser.id);

      if (error) {
        console.error('Błąd aktualizacji adresu email:', error);
        
        if (error.message?.includes('permission') || error.code === '42501') {
          throw new Error("Brak uprawnień do zmiany adresu email. Skontaktuj się z administratorem systemu.");
        }
        
        throw new Error(`Nie udało się zaktualizować adresu email: ${error.message}`);
      }

      toast({
        title: "Sukces",
        description: `Adres email dla ${emailEditMember.name} został zaktualizowany na ${newEmail}`
      });
      
      await refreshUserData();
      
      notifyEmailChanged();
      
      setEmailEditMember(null);
      
      if (selectedMember && selectedMember.name === emailEditMember.name) {
        console.log("Updating email in role dialog as well:", newEmail);
        setMemberEmail(newEmail);
      }
      
      setTimeout(() => {
        refreshUserData();
      }, 500);
    } catch (error: any) {
      console.error('Błąd aktualizacji adresu email:', error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zaktualizować adresu email",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="First and last name"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAddMember}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {members.map((member, index) => (
          <MemberListItem
            key={member.id}
            member={member}
            index={index}
            isAdmin={true}
            userRole={findUserRole(member.name, member.id)}
            onToggleActive={handleToggleActive}
            onOpenRoleDialog={() => {
              console.log("Requesting to open role dialog for:", member.name);
              refreshUserData().then(() => handleOpenRoleDialog(member));
            }}
            onRemoveMember={handleRemoveMember}
            onOpenEmailEdit={handleOpenEmailEdit}
          />
        ))}
      </div>

      <MemberRoleDialog
        isOpen={!!selectedMember}
        selectedMember={selectedMember}
        memberEmail={memberEmail}
        selectedRole={selectedRole}
        memberPassword={memberPassword}
        isSubmitting={isSubmitting}
        users={users}
        onClose={handleCloseDialog}
        onSubmit={handleRoleChangeSubmit}
        onEmailChange={setMemberEmail}
        onPasswordChange={setMemberPassword}
        onRoleChange={setSelectedRole}
      />

      <MemberEmailEdit
        isOpen={!!emailEditMember}
        memberName={emailEditMember?.name || ''}
        currentEmail={currentEmailForEdit}
        onClose={() => {
          setEmailEditMember(null);
          setCurrentEmailForEdit('');
          refreshUserData();
        }}
        onSubmit={handleEmailUpdate}
      />
    </div>
  );
};
