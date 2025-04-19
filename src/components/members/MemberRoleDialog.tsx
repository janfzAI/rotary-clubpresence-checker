
import React from 'react';
import type { AppRole } from '@/types/userRoles';
import { MemberAuthFields } from './dialog/MemberAuthFields';
import { MemberRoleSelect } from './dialog/MemberRoleSelect';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MemberRoleDialogProps {
  isOpen: boolean;
  selectedMember: { id: number; name: string; active?: boolean } | null;
  memberEmail: string;
  selectedRole: AppRole;
  memberPassword: string;
  isSubmitting: boolean;
  users: Array<{ email: string; role: AppRole }>;
  onClose: () => void;
  onSubmit: () => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onRoleChange: (role: AppRole) => void;
}

export const MemberRoleDialog = ({
  isOpen,
  selectedMember,
  memberEmail,
  selectedRole,
  memberPassword,
  isSubmitting,
  users,
  onClose,
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onRoleChange
}: MemberRoleDialogProps) => {
  const existingUser = users.find(u => u.email.toLowerCase() === memberEmail.toLowerCase());

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Zarządzaj uprawnieniami - {selectedMember?.name}</AlertDialogTitle>
          <AlertDialogDescription>
            {memberEmail ? (
              <>
                Wybierz rolę dla użytkownika <strong>{memberEmail}</strong>
                {!existingUser && " (nowe konto zostanie utworzone)"}
              </>
            ) : (
              <>
                Przypisz rolę do użytkownika w systemie poprzez podanie adresu email i wybranie roli.
                <strong> Podaj hasło aby utworzyć nowe konto dla tego członka.</strong>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <MemberAuthFields
            memberEmail={memberEmail}
            memberPassword={memberPassword}
            existingUser={!!existingUser}
            onEmailChange={onEmailChange}
            onPasswordChange={onPasswordChange}
          />
          
          <MemberRoleSelect
            selectedRole={selectedRole}
            onRoleChange={onRoleChange}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Przetwarzanie...' : 'Zapisz'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
