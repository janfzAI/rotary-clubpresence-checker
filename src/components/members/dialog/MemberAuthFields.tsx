
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
          className="mb-1"
        />
        <p className="text-sm text-muted-foreground">
          Podaj pełny adres email użytkownika
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="member-password" className="flex items-center">
          {existingUser 
            ? "Nowe hasło (opcjonalne)" 
            : (
              <span className="flex items-center">
                Hasło 
                <span className="text-destructive ml-1">*</span>
                <span className="text-xs text-muted-foreground ml-2">(wymagane dla nowego konta)</span>
              </span>
            )
          }
        </Label>
        <Input 
          id="member-password"
          type="password"
          value={memberPassword}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder={existingUser
            ? "Pozostaw puste aby nie zmieniać hasła" 
            : "Podaj hasło (min. 6 znaków)"}
          className="mb-1"
        />
        
        {!existingUser && !memberPassword && (
          <Alert variant="destructive" className="mt-2 py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Hasło jest wymagane dla nowego konta (minimum 6 znaków)
            </AlertDescription>
          </Alert>
        )}
        
        {!existingUser && memberPassword && memberPassword.length < 6 && (
          <p className="text-sm text-destructive">
            Hasło musi mieć minimum 6 znaków
          </p>
        )}
      </div>
    </>
  );
};
