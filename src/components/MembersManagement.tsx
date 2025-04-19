
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

  // Refresh users data when component mounts
  useEffect(() => {
    console.log("MembersManagement: Initial user data refresh");
    refreshUserData();
  }, [refreshUserData]);

  // Refresh users data when last refresh timestamp changes
  useEffect(() => {
    if (lastRefreshTimestamp > 0) {
      console.log("MembersManagement: User data refreshed at", new Date(lastRefreshTimestamp).toISOString());
    }
  }, [lastRefreshTimestamp]);

  // Function to find user role based on member name with proper logging
  const findUserRole = (memberName: string) => {
    console.log(`Finding role for member: ${memberName}, available users: ${users.length}`);
    
    const normalizedMemberName = memberName.toLowerCase().trim();
    
    // Try exact match first (name appears in email)
    const exactUserMatch = users.find(user => {
      const normalizedEmail = user.email.toLowerCase().trim();
      const userName = normalizedMemberName.replace(/\s+/g, '.');
      const userNameNoSpace = normalizedMemberName.replace(/\s+/g, '');
      
      return normalizedEmail.includes(userName) || normalizedEmail.includes(userNameNoSpace);
    });
    
    if (exactUserMatch) {
      console.log(`Found exact match for ${memberName}: ${exactUserMatch.email} with role ${exactUserMatch.role}`);
      return exactUserMatch.role;
    }
    
    // Try matching by name parts
    const user = users.find(user => {
      const normalizedEmail = user.email.toLowerCase().trim();
      
      const emailParts = normalizedEmail.split('@')[0].split('.');
      const nameParts = normalizedMemberName.split(' ');

      return emailParts.some(part => 
        nameParts.some(namePart => part.includes(namePart) || namePart.includes(part))
      );
    });
    
    if (user) {
      console.log(`Found partial match for ${memberName}: ${user.email} with role ${user.role}`);
    } else {
      console.log(`No role match found for ${memberName}`);
    }
    
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
    console.log("Opening email edit for member:", member.name);
    // Always refresh users list before opening the email edit dialog
    refreshUserData().then(() => {
      setEmailEditMember(member);
    });
  };

  // Enhanced email update function with better synchronization
  const handleEmailUpdate = async (newEmail: string) => {
    if (!emailEditMember) return;

    console.log(`Updating email for ${emailEditMember.name} to ${newEmail}`);
    
    // When updating an email, use the exact email shown in the dialog
    const currentEmailElement = document.getElementById('current-member-email');
    const currentEmail = currentEmailElement ? currentEmailElement.getAttribute('data-email') : '';
    
    console.log('Current email from UI:', currentEmail);
    
    if (!currentEmail) {
      console.error('Cannot find current email');
      toast({
        title: "Error",
        description: "Cannot find current email of the user",
        variant: "destructive"
      });
      return;
    }
    
    // Refresh user data before finding the match
    await refreshUserData();
    
    // Find the user by exact email match
    const matchedUser = users.find(user => user.email.toLowerCase().trim() === currentEmail.toLowerCase().trim());

    if (!matchedUser) {
      console.error('User not found for email:', currentEmail);
      console.error('Available users:', users.map(u => u.email));
      
      toast({
        title: "Error",
        description: "User not found in the system for the given email",
        variant: "destructive"
      });
      return;
    }

    console.log('Found user to update:', matchedUser);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email: newEmail })
        .eq('id', matchedUser.id);

      if (error) {
        console.error('Email update error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Email address for ${emailEditMember.name} has been updated to ${newEmail}`
      });
      
      // Force multiple refreshes to ensure data is up to date
      await refreshUserData();
      
      // Notify about email change to update other components
      notifyEmailChanged();
      
      // Close the email edit dialog
      setEmailEditMember(null);
      
      // If there's a selected member currently shown in the role dialog, update its email too
      if (selectedMember && selectedMember.name === emailEditMember.name) {
        console.log("Updating email in role dialog as well:", newEmail);
        setMemberEmail(newEmail);
      }
      
      // Schedule another refresh after a short delay to ensure all components have the latest data
      setTimeout(() => {
        refreshUserData();
      }, 500);
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update email address",
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
            userRole={findUserRole(member.name)}
            onToggleActive={handleToggleActive}
            onOpenRoleDialog={() => {
              console.log("Requesting to open role dialog for:", member.name);
              // Always refresh users list before opening the role dialog
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
        currentEmail={users.find(u => {
          if (!emailEditMember) return false;
          
          // Try to find an exact match by name in email
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
        onClose={() => {
          setEmailEditMember(null);
          // Refresh data when closing email edit dialog
          refreshUserData();
        }}
        onSubmit={handleEmailUpdate}
      />
    </div>
  );
};
