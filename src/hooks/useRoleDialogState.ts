
import { useState } from 'react';
import type { AppRole } from '@/types/userRoles';

interface Member {
  id: number;
  name: string;
  active?: boolean;
}

export const useRoleDialogState = () => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailChangeTimestamp, setEmailChangeTimestamp] = useState(0);

  const handleCloseDialog = () => {
    setMemberEmail('');
    setMemberPassword('');
    setSelectedRole('user');
    setSelectedMember(null);
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
    emailChangeTimestamp,
    setSelectedMember,
    setSelectedRole,
    setMemberEmail,
    setMemberPassword,
    setIsSubmitting,
    handleCloseDialog,
    notifyEmailChanged
  };
};
