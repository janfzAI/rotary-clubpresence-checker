
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
import { useUserRoles } from "@/hooks/useUserRoles";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/components/ui/use-toast";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { createUserAndSetRole } = useUserRoles();

  const validateInputs = () => {
    if (!newUserEmail) {
      onError("Email jest wymagany");
      return false;
    }
    
    if (!newUserEmail.includes('@')) {
      onError("Niepoprawny format adresu email");
      return false;
    }
    
    if (!newUserPassword || newUserPassword.length < 6) {
      onError("Hasło jest wymagane i musi mieć co najmniej 6 znaków");
      return false;
    }
    
    return true;
  };

  const handleAddUser = async () => {
    if (!validateInputs()) return;
    
    try {
      setIsSubmitting(true);
      
      console.log("Attempting to create user:", newUserEmail);
      
      // Use the createUserAndSetRole function from useUserRoles hook
      const createdEmail = await createUserAndSetRole(
        newUserEmail,
        newUserPassword,
        newUserRole
      );

      console.log("User created successfully:", createdEmail);

      // Success!
      toast({
        title: "Utworzono użytkownika",
        description: `Użytkownik ${createdEmail} został utworzony z rolą ${newUserRole}`
      });
      
      onSuccess();
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setDialogOpen(false);

    } catch (error: any) {
      console.error('Error adding user:', error);
      onError(error.message || "Nie udało się utworzyć użytkownika");
    } finally {
      setIsSubmitting(false);
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
          <Button 
            onClick={handleAddUser} 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Dodawanie...' : 'Dodaj użytkownika'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
