
import React, { useState } from 'react';
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useUserRoles } from "@/hooks/useUserRoles";
import { AddUserDialog } from "./user-roles/AddUserDialog";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export const UserRolesManagement = () => {
  const { users, loading, error, fetchUsers, handleRoleChange } = useUserRoles();
  const { toast } = useToast();
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUsers();
      toast({
        title: "Lista odświeżona",
        description: `Lista użytkowników została zaktualizowana. Znaleziono ${users.length} użytkowników.`
      });
    } catch (error) {
      console.error("Error refreshing users:", error);
      toast({
        title: "Błąd odświeżania",
        description: "Nie udało się odświeżyć listy użytkowników.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setAlertDialogOpen(true);
  };

  const handleSuccess = () => {
    toast({
      title: "Użytkownik utworzony",
      description: "Użytkownik został utworzony i dodany do listy.",
    });
    
    // Fetch updated user list
    fetchUsers();
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
        description: "Nie udało się zmienić uprawnień użytkownika.",
        variant: "destructive"
      });
    }
  };

  // Loading state when we have no users yet
  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Ładowanie użytkowników...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Wystąpił błąd podczas ładowania użytkowników</AlertTitle>
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh}>Spróbuj ponownie</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Zarządzanie uprawnieniami użytkowników</h2>
        <AddUserDialog onSuccess={handleSuccess} onError={handleError} />
      </div>
      
      {loading && users.length > 0 && (
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <Loader2 className="h-3 w-3 animate-spin mr-2" />
          Odświeżanie listy...
        </div>
      )}
      
      <div className="mb-2 text-sm text-muted-foreground">
        Liczba użytkowników w systemie: {users.length}
      </div>
      
      {users.length === 0 ? (
        <div className="p-4 border rounded-md text-center">
          <p className="text-muted-foreground mb-4">Brak użytkowników w systemie lub nie udało się ich załadować.</p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Odśwież listę
          </Button>
        </div>
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
        onClick={handleRefresh} 
        variant="outline"
        className="mt-4"
        disabled={refreshing}
      >
        {refreshing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Odświeżanie...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Odśwież listę ({users.length} użytkowników)
          </>
        )}
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
