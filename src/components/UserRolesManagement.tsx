
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface UserRole {
  id: string;
  email: string;
  role: AppRole;
}

export const UserRolesManagement = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppRole>('user');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email');
      
      if (profilesError) {
        throw profilesError;
      }

      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: isAdmin } = await supabase.rpc('has_role', {
            _user_id: profile.id,
            _role: 'admin'
          });

          const { data: isManager } = await supabase.rpc('has_role', {
            _user_id: profile.id,
            _role: 'manager'
          });

          let role: AppRole = 'user';
          if (isAdmin) role = 'admin';
          else if (isManager) role = 'manager';

          return {
            id: profile.id,
            email: profile.email,
            role
          };
        })
      );

      setUsers(usersWithRoles);
      console.log("Fetched users with roles:", usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Błąd pobierania użytkowników",
        description: "Nie udało się pobrać listy użytkowników. Sprawdź konsolę.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      if (newRole !== 'user') {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: newRole
          });
          
        if (insertError) throw insertError;
      }

      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast({
        title: "Zmieniono uprawnienia",
        description: `Użytkownik ${user.email} ma teraz uprawnienia: ${newRole}`
      });
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        title: "Błąd zmiany uprawnień",
        description: "Nie udało się zmienić uprawnień użytkownika. Sprawdź konsolę.",
        variant: "destructive"
      });
    }
  };

  const handleAddUser = async () => {
    try {
      if (!newUserEmail || !newUserPassword) {
        toast({
          title: "Błąd",
          description: "Email i hasło są wymagane",
          variant: "destructive"
        });
        return;
      }

      // Step 1: Sign up the user through Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error("Nie udało się utworzyć użytkownika");
      }

      // Step 2: Wait a moment to ensure the user is created in the auth.users table
      // and the profiles trigger has run
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Check if the profile exists and create it if it doesn't
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (!existingProfile) {
        // Create profile manually if it doesn't exist
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: newUserEmail
          });
          
        if (profileError) {
          console.error('Error creating profile:', profileError);
          throw profileError;
        }
      }

      // Step 4: Assign the role if not 'user'
      if (newUserRole !== 'user') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: newUserRole
          });
        
        if (roleError) {
          console.error('Error assigning role:', roleError);
          throw roleError;
        }
      }

      toast({
        title: "Sukces",
        description: `Utworzono nowego użytkownika: ${newUserEmail}`
      });

      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setDialogOpen(false);

      // Refresh the list after a short delay to ensure all DB operations are complete
      setTimeout(() => {
        fetchUsers();
      }, 1000);
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Błąd dodawania użytkownika",
        description: "Nie udało się utworzyć użytkownika. Sprawdź konsolę.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Ładowanie użytkowników...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Zarządzanie uprawnieniami użytkowników</h2>
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
      </div>
      
      {users.length === 0 ? (
        <p className="text-muted-foreground">Brak użytkowników w systemie.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email użytkownika</TableHead>
              <TableHead>Uprawnienia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select 
                    value={user.role} 
                    onValueChange={(value: AppRole) => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Wybierz uprawnienia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Użytkownik</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      
      <Button 
        onClick={fetchUsers} 
        variant="outline"
        className="mt-4"
      >
        Odśwież listę
      </Button>
    </div>
  );
};
