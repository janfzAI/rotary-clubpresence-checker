
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
import { Info, AlertCircle, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRoleManagement } from "@/hooks/useRoleManagement";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

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
  const { sendPasswordResetEmail, updateUserPassword } = useRoleManagement();
  const [resetEmailSent, setResetEmailSent] = React.useState(false);
  const [directPasswordUpdateSent, setDirectPasswordUpdateSent] = React.useState(false);
  const [passwordActionError, setPasswordActionError] = React.useState<string | null>(null);
  const [isAdminUser, setIsAdminUser] = React.useState(false);
  
  // Check if current user is the special admin account
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data } = await supabase.auth.getUser();
      const isAdmin = data?.user?.email === 'admin@rotaryszczecin.pl';
      setIsAdminUser(isAdmin);
    };
    
    checkAdminStatus();
  }, [isOpen]);
  
  // Debug the current email value
  useEffect(() => {
    if (isOpen && selectedMember) {
      console.log(`MemberRoleDialog: Current email for ${selectedMember.name}:`, memberEmail);
    }
  }, [isOpen, memberEmail, selectedMember]);
  
  // Reset states when the dialog opens
  useEffect(() => {
    if (isOpen) {
      setResetEmailSent(false);
      setDirectPasswordUpdateSent(false);
      setPasswordActionError(null);
    }
  }, [isOpen, memberEmail]);
  
  const handleSendPasswordReset = async () => {
    if (!memberEmail) return;
    
    try {
      setPasswordActionError(null);
      const result = await sendPasswordResetEmail(memberEmail);
      if (result) {
        setResetEmailSent(true);
      } else {
        setPasswordActionError("Nie udało się wysłać emaila z linkiem do resetowania hasła");
      }
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      setPasswordActionError("Wystąpił błąd podczas wysyłania emaila resetującego hasło");
    }
  };

  const handleDirectPasswordUpdate = async () => {
    if (!memberEmail || !memberPassword || memberPassword.length < 6) {
      setPasswordActionError("Podaj poprawne hasło (min. 6 znaków)");
      return;
    }
    
    if (!existingUser) {
      setPasswordActionError("Nie można zaktualizować hasła dla nieistniejącego użytkownika");
      return;
    }
    
    try {
      setPasswordActionError(null);
      const result = await updateUserPassword(existingUser.id, memberPassword);
      if (result) {
        setDirectPasswordUpdateSent(true);
        setPasswordActionError(null);
      } else {
        // Error handling is now done in the updateUserPassword function with toasts
      }
    } catch (error) {
      console.error("Failed to update password:", error);
      setPasswordActionError("Wystąpił błąd podczas aktualizacji hasła");
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
                <strong> Podaj hasło aby utworzyć nowe konto dla tego członka lub zmienić hasło istniejącego.</strong>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {!isAdminUser && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ograniczony dostęp</AlertTitle>
              <AlertDescription className="text-sm">
                <strong>Uwaga:</strong> Tylko konto <strong>admin@rotaryszczecin.pl</strong> (hasło: <strong>admin123</strong>) 
                posiada uprawnienia do bezpośredniej zmiany haseł. Zaloguj się ponownie używając tego konta aby aktywować wszystkie funkcje.
              </AlertDescription>
            </Alert>
          )}
          
          {isAdminUser && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Konto administratora:</strong> Masz pełne uprawnienia do zarządzania użytkownikami i hasłami.
              </AlertDescription>
            </Alert>
          )}
          
          {isNewUser && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Tworzenie nowego konta:</strong> Podaj adres email i hasło dla nowego użytkownika.
                {!isAdminUser && " Aby ustawić hasło, zaloguj się jako admin@rotaryszczecin.pl."}
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
            <div className="space-y-2 mt-2">
              <Alert variant={!isAdminUser ? "destructive" : "default"} className="mb-4">
                <Lock className="h-4 w-4" />
                <AlertTitle>{!isAdminUser ? "Tylko administrator może zmieniać hasła" : "Bezpośrednia zmiana hasła"}</AlertTitle>
                <AlertDescription className="text-sm">
                  {!isAdminUser ? (
                    <>Błąd <strong>"user not allowed"</strong> oznacza, że musisz być zalogowany jako <strong>admin@rotaryszczecin.pl</strong> aby zmienić hasło.</>
                  ) : (
                    <>Jako administrator możesz bezpośrednio zmienić hasło użytkownika.</>
                  )}
                </AlertDescription>
              </Alert>
              
              <Button 
                type="button" 
                variant={directPasswordUpdateSent ? "outline" : "secondary"}
                onClick={handleDirectPasswordUpdate}
                disabled={directPasswordUpdateSent || !memberPassword || memberPassword.length < 6 || !isAdminUser}
                className="w-full"
              >
                {directPasswordUpdateSent 
                  ? "Hasło zostało zaktualizowane" 
                  : "Zaktualizuj hasło bezpośrednio"}
                {!isAdminUser && <Lock className="ml-2 h-4 w-4" />}
              </Button>
              
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
              
              {(resetEmailSent || directPasswordUpdateSent) && !passwordActionError && (
                <p className="text-sm text-green-600 mt-1">
                  {resetEmailSent 
                    ? `Email z linkiem do resetowania hasła został wysłany na adres ${memberEmail}` 
                    : "Hasło zostało zaktualizowane pomyślnie"}
                </p>
              )}
              
              {passwordActionError && (
                <p className="text-sm text-red-600 mt-1">
                  {passwordActionError}
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <AlertDialogAction 
                    onClick={onSubmit}
                    disabled={isSubmitting || !memberEmail || (isNewUser && !memberPassword)}
                    className="inline-flex items-center"
                  >
                    {isSubmitting ? 'Przetwarzanie...' : 'Zapisz'}
                  </AlertDialogAction>
                </span>
              </TooltipTrigger>
              {isNewUser && !memberPassword && (
                <TooltipContent>
                  <p>Podaj hasło dla nowego konta</p>
                </TooltipContent>
              )}
              {!memberEmail && (
                <TooltipContent>
                  <p>Podaj adres email</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
