
import React, { useEffect } from 'react';
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
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRoleManagement } from "@/hooks/useRoleManagement";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MemberRoleDialogProps {
  isOpen: boolean;
  selectedMember: { id: number; name: string; active?: boolean } | null;
  memberEmail: string;
  selectedRole: AppRole;
  memberPassword: string;
  isSubmitting: boolean;
  users: Array<{ id: string; email: string; role: AppRole }>;
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
  const isNewUser = memberEmail && !existingUser;
  const { sendPasswordResetEmail } = useRoleManagement();
  const [resetEmailSent, setResetEmailSent] = React.useState(false);
  
  // Debug the current email value
  useEffect(() => {
    if (isOpen && selectedMember) {
      console.log(`MemberRoleDialog: Current email for ${selectedMember.name}:`, memberEmail);
    }
  }, [isOpen, memberEmail, selectedMember]);
  
  // Reset the resetEmailSent state when the dialog opens
  useEffect(() => {
    if (isOpen) {
      setResetEmailSent(false);
    }
  }, [isOpen, memberEmail]);
  
  const handleSendPasswordReset = async () => {
    if (!memberEmail) return;
    
    try {
      const result = await sendPasswordResetEmail(memberEmail);
      if (result) {
        setResetEmailSent(true);
      }
    } catch (error) {
      console.error("Failed to send password reset email:", error);
    }
  };

  return (
    <AlertDialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center justify-between">
            <span>Zarządzaj uprawnieniami - {selectedMember?.name}</span>
            <div id="current-member-email" data-email={memberEmail} className="hidden"></div>
          </AlertDialogTitle>
          <AlertDialogDescription>
            {memberEmail ? (
              <>
                Wybierz rolę dla użytkownika <strong>{memberEmail}</strong>
                {isNewUser && " (nowe konto zostanie utworzone)"}
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
          {isNewUser && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Uwaga:</strong> Aby utworzyć nowego użytkownika, konto używane do logowania musi 
                mieć uprawnienia administratora w Supabase. Jeśli operacja się nie powiedzie, 
                użyj istniejącego adresu e-mail lub skontaktuj się z administratorem systemu.
              </AlertDescription>
            </Alert>
          )}
          
          <MemberAuthFields
            memberEmail={memberEmail}
            memberPassword={memberPassword}
            existingUser={!!existingUser}
            onEmailChange={onEmailChange}
            onPasswordChange={onPasswordChange}
          />
          
          {existingUser && (
            <div className="mt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSendPasswordReset}
                disabled={resetEmailSent}
                className="w-full"
              >
                {resetEmailSent 
                  ? "Link do resetowania hasła wysłany" 
                  : "Wyślij link do resetowania hasła"}
              </Button>
              {resetEmailSent && (
                <p className="text-sm text-green-600 mt-1">
                  Email z linkiem do resetowania hasła został wysłany na adres {memberEmail}
                </p>
              )}
            </div>
          )}
          
          <MemberRoleSelect
            selectedRole={selectedRole}
            onRoleChange={onRoleChange}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onSubmit}
            disabled={isSubmitting || !memberEmail}
          >
            {isSubmitting ? 'Przetwarzanie...' : 'Zapisz'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
