
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

  const handleEmailUpdate = async (newEmail: string) => {
    if (!emailEditMember) return;

    const matchedUser = users.find(user => {
      const normalizedEmail = user.email.toLowerCase().trim();
      const nameParts = emailEditMember.name.split(' ');
      const emailParts = normalizedEmail.split('@')[0].split('.');
      return emailParts.some(part => 
        nameParts.some(namePart => part.includes(namePart))
      );
    });

    if (!matchedUser) {
      toast({
        title: "Błąd",
        description: "Nie znaleziono użytkownika w systemie",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email: newEmail })
        .eq('id', matchedUser.id);

      if (error) throw error;

      toast({
        title: "Sukces",
        description: `Adres email dla ${emailEditMember.name} został zaktualizowany`
      });
      
      await fetchUsers();
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
          const nameParts = (emailEditMember?.name || '').split(' ');
          return nameParts.some(part => 
            u.email.toLowerCase().includes(part.toLowerCase())
          );
        })?.email || ''}
        onClose={() => setEmailEditMember(null)}
        onSubmit={handleEmailUpdate}
      />
    </div>
  );
};
