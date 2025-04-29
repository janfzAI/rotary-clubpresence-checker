
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
import { Info, AlertCircle, Lock, CheckCircle } from "lucide-react";
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
  const [currentUserEmail, setCurrentUserEmail] = React.useState<string | null>(null);
  
  // Check if current user is the special admin account
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data } = await supabase.auth.getUser();
      const email = data?.user?.email || null;
      setCurrentUserEmail(email);
      const isAdmin = email === 'admin@rotaryszczecin.pl';
      setIsAdminUser(isAdmin);
      console.log(`Current user: ${email}, isSpecialAdmin: ${isAdmin}`);
    };
    
    if (isOpen) {
      checkAdminStatus();
      setResetEmailSent(false);
      setDirectPasswordUpdateSent(false);
      setPasswordActionError(null);
    }
  }, [isOpen]);
  
  // Debug the current email value
  useEffect(() => {
    if (isOpen && selectedMember) {
      console.log(`MemberRoleDialog: Current email for ${selectedMember.name}:`, memberEmail);
    }
  }, [isOpen, memberEmail, selectedMember]);
  
  const handleSendPasswordReset = async () => {
    if (!memberEmail) return;
    
    try {
      setPasswordActionError(null);
      const result = await sendPasswordResetEmail(memberEmail);
      if (result) {
        setResetEmailSent(true);
        toast({
          title: "Email wysłany",
          description: `Link do resetowania hasła został wysłany na adres ${memberEmail}`
        });
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
        // Error handling is done in the updateUserPassword function with toasts
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
          {isAdminUser ? (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Pełne uprawnienia administratora</AlertTitle>
              <AlertDescription className="text-sm">
                Jesteś zalogowany jako <strong>admin@rotaryszczecin.pl</strong> i masz pełne uprawnienia 
                do zarządzania użytkownikami i ich hasłami.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wymagane specjalne konto administratora</AlertTitle>
              <AlertDescription className="text-sm">
                <strong>Uwaga:</strong> Do zmiany haseł wymagane jest konto <strong>admin@rotaryszczecin.pl</strong> (hasło: <strong>admin123</strong>).
                Aktualnie jesteś zalogowany jako: <strong>{currentUserEmail || "Nieznany użytkownik"}</strong>.
                <div className="mt-2">
                  <a 
                    href="/?admin=true" 
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm inline-flex items-center"
                  >
                    <Lock className="mr-1 h-3 w-3" /> Zaloguj jako admin@rotaryszczecin.pl
                  </a>
                </div>
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
              {isAdminUser ? (
                <Alert variant="default" className="mb-4">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle>Bezpośrednia zmiana hasła dostępna</AlertTitle>
                  <AlertDescription className="text-sm">
                    Jako <strong>admin@rotaryszczecin.pl</strong> możesz bezpośrednio zmienić hasło użytkownika.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive" className="mb-4">
                  <Lock className="h-4 w-4" />
                  <AlertTitle>Tylko admin@rotaryszczecin.pl może zmieniać hasła</AlertTitle>
                  <AlertDescription className="text-sm">
                    Aby zmienić hasło, musisz być zalogowany jako <strong>admin@rotaryszczecin.pl</strong>.
                    Kliknij link powyżej, aby zalogować się jako administrator.
                  </AlertDescription>
                </Alert>
              )}
              
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
