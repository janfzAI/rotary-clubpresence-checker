
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppRole } from '@/types/userRoles';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
          <div className="space-y-2">
            <Label htmlFor="member-email">Email użytkownika</Label>
            <Input 
              id="member-email" 
              value={memberEmail} 
              onChange={(e) => onEmailChange(e.target.value)} 
              placeholder="adres@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-password">
              {existingUser 
                ? "Nowe hasło (opcjonalne)" 
                : "Hasło (wymagane dla nowego konta)"}
            </Label>
            <Input 
              id="member-password"
              type="password"
              value={memberPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder={existingUser
                ? "Pozostaw puste aby nie zmieniać hasła" 
                : "Podaj hasło dla nowego konta"}
              required={!existingUser}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-role">Rola</Label>
            <Select 
              value={selectedRole} 
              onValueChange={(value) => onRoleChange(value as AppRole)}
            >
              <SelectTrigger id="member-role">
                <SelectValue placeholder="Wybierz rolę" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Role</SelectLabel>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">Użytkownik</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
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
