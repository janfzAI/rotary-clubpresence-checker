
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
      
      // Create user with auto-confirm enabled
      const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true,
        user_metadata: {
          role: newUserRole
        }
      });

      if (signUpError) {
        console.error("Error creating user:", signUpError);
        throw signUpError;
      }

      if (!authData || !authData.user) {
        console.error("No user data returned");
        throw new Error("Nie udało się utworzyć użytkownika");
      }

      console.log("User created successfully:", authData.user.id);

      // Add user to profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: newUserEmail
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        throw profileError;
      }

      console.log("Profile created successfully");

      // Add role for the new user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: newUserRole
        });

      if (roleError) {
        console.error("Error setting role:", roleError);
        throw roleError;
      }

      console.log("Role set successfully");

      // Success!
      toast({
        title: "Utworzono użytkownika",
        description: `Użytkownik ${newUserEmail} został utworzony z rolą ${newUserRole}`
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
