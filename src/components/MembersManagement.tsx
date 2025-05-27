
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useMemberRoleManagement } from "@/hooks/useMemberRoleManagement";
import { useMembers } from "@/hooks/useMembers";
import { MemberListItem } from './members/MemberListItem';
import { MemberRoleDialog } from './members/MemberRoleDialog';
import { MemberEmailEdit } from './members/dialog/MemberEmailEdit';
import { supabase } from "@/integrations/supabase/client";

export const MembersManagement = () => {
  const [newMemberName, setNewMemberName] = useState('');
  const [emailEditMember, setEmailEditMember] = useState<{ id: number; name: string } | null>(null);
  const [currentEmailForEdit, setCurrentEmailForEdit] = useState<string>('');
  const [forceUpdate, setForceUpdate] = useState<number>(0);
  const { toast } = useToast();
  
  const {
    members,
    loading: membersLoading,
    addMember,
    removeMember,
    toggleActive,
    generateEmail,
    createAccountsForAllMembers
  } = useMembers();
  
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
    lastRefreshTimestamp,
    memberEmailMappings,
    getEmailByMemberId
  } = useMemberRoleManagement();

  // Always refresh data when component mounts
  useEffect(() => {
    console.log("MembersManagement: Initial user data refresh");
    refreshUserData();
  }, [refreshUserData]);

  // Refresh data when lastRefreshTimestamp changes
  useEffect(() => {
    if (lastRefreshTimestamp > 0) {
      console.log("MembersManagement: User data refreshed at", new Date(lastRefreshTimestamp).toISOString());
      // Force component update to re-render badges
      setForceUpdate(prev => prev + 1);
    }
  }, [lastRefreshTimestamp]);

  // Find user role by first checking stored mappings, then by name matching
  const findUserRole = (member: { id: number; name: string }) => {
    if (!member || !member.id) return undefined;
    
    const memberIdStr = String(member.id);
    const memberName = member.name;
    
    console.log(`Finding role for member: ${memberName} (ID: ${memberIdStr}), with ${users.length} users available`);
    
    // First try to find by saved email mapping
    const mappedEmail = getEmailByMemberId(memberIdStr);
    if (mappedEmail) {
      console.log(`Found mapped email for ${memberName}: ${mappedEmail}`);
      const mappedUser = users.find(user => 
        user.email && user.email.toLowerCase().trim() === mappedEmail.toLowerCase().trim()
      );
      
      if (mappedUser) {
        console.log(`Found user by mapped email with role: ${mappedUser.role}`);
        return mappedUser.role;
      }
    }
    
    // If no mapping found, try to find by generated email
    const generatedEmail = generateEmail(memberName);
    const generatedUser = users.find(user => 
      user.email && user.email.toLowerCase().trim() === generatedEmail.toLowerCase().trim()
    );
    
    if (generatedUser) {
      console.log(`Found user by generated email ${generatedEmail} with role: ${generatedUser.role}`);
      return generatedUser.role;
    }
    
    // Try to find by name
    const normalizedMemberName = memberName.toLowerCase().trim();
    
    // Try exact name match in email (first.last@domain.com)
    const nameParts = normalizedMemberName.split(/\s+/);
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      
      const nameMatchUser = users.find(user => {
        if (!user.email) return false;
        const normalizedEmail = user.email.toLowerCase();
        
        return normalizedEmail.includes(`${firstName}.${lastName}`) || 
               normalizedEmail.includes(`${lastName}.${firstName}`);
      });
      
      if (nameMatchUser) {
        console.log(`Found exact name match for ${memberName}: ${nameMatchUser.email} with role ${nameMatchUser.role}`);
        return nameMatchUser.role;
      }
    }
    
    console.log(`No role match found for ${memberName}`);
    return undefined;
  };

  const findCurrentEmailForMember = (memberName: string): string => {
    console.log(`Finding current email for member: ${memberName}`);
    
    if (!memberName || !users || users.length === 0) {
      console.log("No member name provided or no users available");
      return generateEmail(memberName);
    }
    
    // First try generated email
    const generatedEmail = generateEmail(memberName);
    const generatedUser = users.find(user => 
      user.email && user.email.toLowerCase().trim() === generatedEmail.toLowerCase().trim()
    );
    
    if (generatedUser) {
      console.log(`Found user with generated email: ${generatedEmail}`);
      return generatedEmail;
    }
    
    // Fall back to other matching logic
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
    
    // Return generated email as fallback
    return generatedEmail;
  };

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      addMember(newMemberName.trim());
      setNewMemberName('');
    }
  };

  const handleRemoveMember = (id: number, name: string) => {
    if (window.confirm(`Czy na pewno chcesz całkowicie usunąć ${name} z systemu? Ta operacja jest nieodwracalna.`)) {
      removeMember(id);
    }
  };

  const handleToggleActive = (id: number, name: string, isCurrentlyActive: boolean) => {
    toggleActive(id);
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

  // Handle role update after closing the dialog
  const handleDialogClose = () => {
    console.log("Dialog closed, refreshing data");
    refreshUserData().then(() => {
      // Force component update to re-render badges
      setForceUpdate(prev => prev + 1);
    });
    handleCloseDialog();
  };

  const handleCreateAllAccounts = () => {
    if (window.confirm(`Czy na pewno chcesz utworzyć konta email dla wszystkich ${members.length} członków klubu? Każde konto będzie miał adres w domenie @rotary.szczecin.pl i hasło "naszklubrotary".`)) {
      createAccountsForAllMembers();
    }
  };

  if (membersLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <div className="text-center">
          <Users className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <span>Ładowanie członków...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="Imię i nazwisko"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAddMember}>
            <Plus className="w-4 h-4 mr-2" />
            Dodaj
          </Button>
        </div>
        <Button 
          onClick={handleCreateAllAccounts}
          variant="outline"
          className="bg-blue-50 hover:bg-blue-100 border-blue-200"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Utwórz konta dla wszystkich ({members.length})
        </Button>
      </div>

      <div className="space-y-3">
        {members.map((member, index) => (
          <MemberListItem
            key={`${member.id}-${forceUpdate}`}
            member={member}
            index={index}
            isAdmin={true}
            userRole={findUserRole(member)}
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
        onClose={handleDialogClose}
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
