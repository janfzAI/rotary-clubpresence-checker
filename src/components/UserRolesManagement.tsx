
import React from 'react';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUserRoles } from "@/hooks/useUserRoles";
import { AddUserDialog } from "./user-roles/AddUserDialog";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export const UserRolesManagement = () => {
  const { users, loading, fetchUsers, handleRoleChange } = useUserRoles();
  const { toast } = useToast();
  const [alertDialogOpen, setAlertDialogOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleError = (message: string) => {
    setErrorMessage(message);
    setAlertDialogOpen(true);
  };

  const handleSuccess = () => {
    toast({
      title: "Użytkownik utworzony",
      description: "Użytkownik został utworzony. Konto musi zostać aktywowane poprzez link wysłany na email. Dodaj uprawnienia po aktywacji konta.",
    });
    
    setTimeout(() => {
      fetchUsers();
    }, 2000);
  };

  const onRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      const userEmail = await handleRoleChange(userId, newRole);
      if (userEmail) {
        toast({
          title: "Zmieniono uprawnienia",
          description: `Użytkownik ${userEmail} ma teraz uprawnienia: ${newRole}`
        });
      }
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Zarządzanie uprawnieniami użytkowników</h2>
        <AddUserDialog onSuccess={handleSuccess} onError={handleError} />
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
                    onValueChange={(value: AppRole) => onRoleChange(user.id, value)}
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

      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Błąd dodawania użytkownika</AlertDialogTitle>
            <AlertDialogDescription>
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
