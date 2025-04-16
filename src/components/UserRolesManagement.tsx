
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
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
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all users that have profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email');
      
      if (profilesError) {
        throw profilesError;
      }

      // For each user, check their roles
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          // Check admin role
          const { data: isAdmin } = await supabase.rpc('has_role', {
            _user_id: profile.id,
            _role: 'admin'
          });

          // Check manager role
          const { data: isManager } = await supabase.rpc('has_role', {
            _user_id: profile.id,
            _role: 'manager'
          });

          // Determine highest role
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

      // First remove all roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Then add the new role if it's not 'user'
      if (newRole !== 'user') {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: newRole
          });
          
        if (insertError) throw insertError;
      }

      // Update local state
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
      <h2 className="text-xl font-semibold">Zarządzanie uprawnieniami użytkowników</h2>
      
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
