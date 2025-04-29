import React, { useState, useEffect, useMemo } from 'react';
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
      return partialMatch.role;
    }
    
    if (memberName.toLowerCase().includes("jan jurga")) {
      const janUser = users.find(u => 
        u.email && (u.email.toLowerCase().includes("jan") && u.email.toLowerCase().includes("jurga"))
      );
      if (janUser) {
        return janUser.role;
      }
    }
    
    return undefined;
  };

  const findCurrentEmailForMember = (memberName: string): string => {
    if (!memberName || !users || users.length === 0) {
      return '';
    }
    
    if (memberName.toLowerCase().includes("jan jurga")) {
      const janUser = users.find(u => 
        u.email && (u.email.toLowerCase().includes("jan") || u.email.toLowerCase().includes("jurga"))
      );
      if (janUser && janUser.email) {
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
        return matchedUser.email;
      }
    }
    
    for (const user of users) {
      if (!user.email) continue;
      
      const userEmail = user.email.toLowerCase();
      const nameParts = memberName.toLowerCase().split(' ');
      
      for (const part of nameParts) {
        if (part.length > 2 && userEmail.includes(part)) {
          return user.email;
        }
      }
    }
    
    return '';
  };

  const userRoleCache = useMemo(() => {
    const cache = new Map();
    members.forEach(member => {
      const role = findUserRole(member.name, member.id);
      if (role) {
        cache.set(member.id, role);
      }
    });
    return cache;
  }, [members, users, lastRefreshTimestamp]);

  const getCachedUserRole = (memberName: string, memberId: number) => {
    if (userRoleCache.has(memberId)) {
      return userRoleCache.get(memberId);
    }
    return findUserRole(memberName, memberId);
  };

  const emailCache = useMemo(() => {
    const cache = new Map();
    members.forEach(member => {
      const email = findCurrentEmailForMember(member.name);
      if (email) {
        cache.set(member.id, email);
      }
    });
    return cache;
  }, [members, users, lastRefreshTimestamp]);

  const getCachedEmail = (memberName: string, memberId: number) => {
    if (emailCache.has(memberId)) {
      return emailCache.get(memberId);
    }
    return findCurrentEmailForMember(memberName);
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
    
    const cachedEmail = getCachedEmail(member.name, member.id);
    
    if (cachedEmail) {
      console.log("Using cached email for edit:", cachedEmail);
      setEmailEditMember(member);
      setCurrentEmailForEdit(cachedEmail);
    } else {
      refreshUserData().then(() => {
        const email = findCurrentEmailForMember(member.name);
        console.log("Current email found for email edit:", email);
        
        setEmailEditMember(member);
        setCurrentEmailForEdit(email);
      });
    }
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

    // Skip update if email hasn't changed
    if (newEmail === currentEmail) {
      console.log('Email unchanged, skipping update');
      toast({
        title: "Informacja",
        description: "Adres email nie został zmieniony"
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
      // Check if the new email is already used by another user
      const existingUser = users.find(user => 
        user.email && 
        user.email.toLowerCase().trim() === newEmail.toLowerCase().trim() &&
        user.id !== matchedUser.id
      );

      if (existingUser) {
        throw new Error("Ten adres email jest już używany przez innego użytkownika. Proszę wybrać inny adres email.");
      }

      const { error } = await supabase
        .from('profiles')
        .update({ email: newEmail })
        .eq('id', matchedUser.id);

      if (error) {
        console.error('Błąd aktualizacji adresu email:', error);
        
        if (error.message?.includes('duplicate key') || error.code === '23505') {
          throw new Error("Ten adres email jest już używany przez innego użytkownika. Proszę wybrać inny adres email.");
        }
        
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
      throw error;
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
            userRole={getCachedUserRole(member.name, member.id)}
            onToggleActive={handleToggleActive}
            onOpenRoleDialog={() => {
              console.log("Requesting to open role dialog for:", member.name);
              const currentTime = Date.now();
              if (currentTime - lastRefreshTimestamp > 10000) {
                refreshUserData().then(() => handleOpenRoleDialog(member));
              } else {
                handleOpenRoleDialog(member);
              }
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
        }}
        onSubmit={handleEmailUpdate}
      />
    </div>
  );
};
