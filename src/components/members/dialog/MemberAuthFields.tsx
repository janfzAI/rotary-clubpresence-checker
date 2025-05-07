
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MemberAuthFieldsProps {
  memberEmail: string;
  memberPassword: string;
  existingUser: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
}

export const MemberAuthFields = ({
  memberEmail,
  memberPassword,
  existingUser,
  onEmailChange,
  onPasswordChange
}: MemberAuthFieldsProps) => {
  return (
    <>
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
    </>
  );
};
