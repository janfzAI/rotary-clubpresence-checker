
import React, { useState } from 'react';
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
    fetchUsers
  } = useMemberRoleManagement();

  // Function to find user role based on member name
  const findUserRole = (memberName: string) => {
    const normalizedMemberName = memberName.toLowerCase().trim();
    const user = users.find(user => {
      const normalizedEmail = user.email.toLowerCase().trim();
      
      const emailParts = normalizedEmail.split('@')[0].split('.');
      const nameParts = normalizedMemberName.split(' ');

      return emailParts.some(part => 
        nameParts.some(namePart => part.includes(namePart))
      );
    });
    
    return user?.role;
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
    setEmailEditMember(member);
  };

  // Improved email update function with more specific matching
  const handleEmailUpdate = async (newEmail: string) => {
    if (!emailEditMember) return;

    console.log(`Próba aktualizacji adresu email dla ${emailEditMember.name} na ${newEmail}`);
    
    // When updating an email, we should use the exact email shown in the dialog
    // rather than trying to match it again, as that's what's causing the issue
    const currentEmailElement = document.getElementById('current-member-email');
    const currentEmail = currentEmailElement ? currentEmailElement.getAttribute('data-email') : '';
    
    console.log('Current email from UI:', currentEmail);
    
    if (!currentEmail) {
      console.error('Nie można odnaleźć bieżącego adresu email');
      toast({
        title: "Błąd",
        description: "Nie można odnaleźć bieżącego adresu email użytkownika",
        variant: "destructive"
      });
      return;
    }
    
    // Find the user by exact email match
    const matchedUser = users.find(user => user.email.toLowerCase().trim() === currentEmail.toLowerCase().trim());

    if (!matchedUser) {
      console.error('Nie znaleziono użytkownika dla adresu email:', currentEmail);
      console.error('Dostępni użytkownicy:', users.map(u => u.email));
      
      toast({
        title: "Błąd",
        description: "Nie znaleziono użytkownika w systemie dla podanego adresu email",
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
        console.error('Błąd aktualizacji email:', error);
        throw error;
      }

      toast({
        title: "Sukces",
        description: `Adres email dla ${emailEditMember.name} został zaktualizowany na ${newEmail}`
      });
      
      // Force refresh of users data
      await fetchUsers();
      
      // Close the email edit dialog
      setEmailEditMember(null);
      
      // If there's a selected member currently shown in the role dialog, update its email too
      if (selectedMember && selectedMember.name === emailEditMember.name) {
        setMemberEmail(newEmail);
      }
    } catch (error: any) {
      console.error('Error updating email:', error);
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
      </div>

      <div className="space-y-3">
        {members.map((member, index) => (
          <MemberListItem
            key={member.id}
            member={member}
            index={index}
            isAdmin={true}
            userRole={findUserRole(member.name)}
            onToggleActive={handleToggleActive}
            onOpenRoleDialog={handleOpenRoleDialog}
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
        currentEmail={users.find(u => {
          if (!emailEditMember) return false;
          
          // Try to find an exact match first by name in email
          const userName = emailEditMember.name.toLowerCase().replace(/\s+/g, '.');
          const userNameNoSpace = emailEditMember.name.toLowerCase().replace(/\s+/g, '');
          
          if (u.email.toLowerCase().includes(userName) || 
              u.email.toLowerCase().includes(userNameNoSpace)) {
            return true;
          }
          
          // More specific matching based on first name and last name
          const nameParts = emailEditMember.name.toLowerCase().split(' ');
          if (nameParts.length === 2) {
            const [firstName, lastName] = nameParts;
            
            // Common email formats
            if (u.email.toLowerCase().startsWith(`${firstName}.${lastName}`) ||
                u.email.toLowerCase().startsWith(`${lastName}.${firstName}`) ||
                u.email.toLowerCase().startsWith(`${firstName}${lastName}`) ||
                u.email.toLowerCase().startsWith(`${lastName}${firstName}`) ||
                u.email.toLowerCase().startsWith(`${firstName[0]}${lastName}`) ||
                u.email.toLowerCase().startsWith(`${lastName[0]}${firstName}`)) {
              return true;
            }
          }
          
          return false;
        })?.email || ''}
        onClose={() => setEmailEditMember(null)}
        onSubmit={handleEmailUpdate}
      />
    </div>
  );
};
