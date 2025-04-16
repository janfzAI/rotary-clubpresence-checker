
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AddUserDialogProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

export const AddUserDialog = ({ onSuccess, onError }: AddUserDialogProps) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppRole>('user');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddUser = async () => {
    try {
      if (!newUserEmail || !newUserPassword) {
        onError("Email i hasło są wymagane");
        return;
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error("Nie udało się utworzyć użytkownika");
      }

      onSuccess();
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setDialogOpen(false);

    } catch (error: any) {
      console.error('Error adding user:', error);
      onError(error.message || "Nie udało się utworzyć użytkownika");
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Dodaj użytkownika
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj nowego użytkownika</DialogTitle>
          <DialogDescription>
            Wprowadź dane nowego użytkownika i wybierz jego uprawnienia.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="email">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="uzytkownik@przykład.pl"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password">Hasło</label>
            <Input
              id="password"
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label>Uprawnienia</label>
            <Select value={newUserRole} onValueChange={(value: AppRole) => setNewUserRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz uprawnienia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Użytkownik</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddUser} className="w-full">
            Dodaj użytkownika
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
