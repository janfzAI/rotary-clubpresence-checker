
import React, { useState } from 'react';
import { Loader2, RefreshCw, AlertTriangle, Info, Plus, SortAsc, UserCog } from "lucide-react";
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
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useUserRoles } from "@/hooks/useUserRoles";
import { AddUserDialog } from "./user-roles/AddUserDialog";
import type { Database } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Member {
  id: number;
  name: string;
  active?: boolean;
}

export const UserRolesManagement = ({ 
  members,
  onAddMember,
  onRemoveMember,
  onToggleActive
}: {
  members: Member[];
  onAddMember: (name: string) => void;
  onRemoveMember: (id: number) => void;
  onToggleActive?: (id: number) => void;
}) => {
  const { users, loading, error, fetchUsers, handleRoleChange, createUserAndSetRole } = useUserRoles();
  const { toast } = useToast();
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [sortedAlphabetically, setSortedAlphabetically] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const { isAdmin } = useAuth();

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

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      onAddMember(newMemberName.trim());
      setNewMemberName('');
      toast({
        title: "Dodano nowego członka",
        description: `${newMemberName} został dodany do listy.`
      });
    }
  };

  const handleRemoveMember = (id: number, name: string) => {
    if (window.confirm(`Czy na pewno chcesz całkowicie usunąć ${name} z systemu? Ta operacja jest nieodwracalna.`)) {
      onRemoveMember(id);
      toast({
        title: "Usunięto członka",
        description: `${name} został całkowicie usunięty z systemu.`
      });
    }
  };

  const handleToggleActive = (id: number, name: string, isCurrentlyActive: boolean) => {
    if (onToggleActive) {
      onToggleActive(id);
      toast({
        title: isCurrentlyActive ? "Dezaktywowano członka" : "Aktywowano członka",
        description: `${name} został ${isCurrentlyActive ? 'dezaktywowany' : 'aktywowany'}.`
      });
    }
  };

  const toggleSort = () => {
    setSortedAlphabetically(!sortedAlphabetically);
    toast({
      title: "Lista posortowana",
      description: `Lista została posortowana ${!sortedAlphabetically ? 'alfabetycznie' : 'według kolejności dodawania'}.`
    });
  };

  const handleRoleChangeSubmit = async () => {
    if (!memberEmail || !selectedRole) {
      toast({
        title: "Błąd",
        description: "Proszę podać email i wybrać rolę",
        variant: "destructive"
      });
      return;
    }

    if (!memberPassword && !users.find(u => u.email.toLowerCase() === memberEmail.toLowerCase())) {
      toast({
        title: "Błąd",
        description: "Hasło jest wymagane aby utworzyć nowe konto",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log(`Attempting to change role for ${memberEmail} to ${selectedRole}`);
      const user = users.find(u => u.email.toLowerCase() === memberEmail.toLowerCase());
      
      if (!user) {
        console.log(`No user found with email: ${memberEmail}, will attempt to create one`);
        
        try {
          console.log(`Creating new user with email: ${memberEmail}, role: ${selectedRole}`);
          
          if (!memberPassword) {
            toast({
              title: "Błąd",
              description: "Hasło jest wymagane dla nowego użytkownika",
              variant: "destructive"
            });
            return;
          }
          
          const createdEmail = await createUserAndSetRole(
            memberEmail, 
            memberPassword, 
            selectedRole,
            selectedMember?.name
          );
          
          console.log(`Successfully created user: ${createdEmail}`);
          toast({
            title: "Utworzono nowego użytkownika",
            description: `Pomyślnie utworzono konto ${createdEmail} z rolą ${selectedRole}`
          });
          
          await fetchUsers();
          setMemberEmail('');
          setMemberPassword('');
          setSelectedRole('user');
          setSelectedMember(null);
          return;
        } catch (createError: any) {
          console.error("Error creating user:", createError);
          toast({
            title: "Błąd",
            description: `Nie udało się utworzyć nowego użytkownika: ${createError.message || "Nieznany błąd"}`,
            variant: "destructive"
          });
          return;
        }
      }
      
      if (memberPassword) {
        const updatedEmail = await handleRoleChange(user.id, selectedRole, memberPassword);
        
        if (updatedEmail) {
          toast({
            title: "Zmieniono uprawnienia",
            description: `Pomyślnie zmieniono rolę użytkownika ${updatedEmail} na ${selectedRole} i zaktualizowano hasło`
          });
        }
      } else {
        console.log(`Found user: ${user.id}, ${user.email}, current role: ${user.role}`);
        
        try {
          if (memberPassword) {
            console.log(`Attempting to change role for user ${user.id} to ${selectedRole}`);
            
            try {
              const updatedEmail = await handleRoleChange(user.id, selectedRole, memberPassword);
              
              if (updatedEmail) {
                toast({
                  title: "Zmieniono uprawnienia",
                  description: `Pomyślnie zmieniono rolę użytkownika ${updatedEmail} na ${selectedRole} i zaktualizowano hasło`
                });
              }
            } catch (passwordError: any) {
              // Handle password update error but still try to update role
              console.error("Password update error:", passwordError);
              
              // If this is a "not_admin" or permission error, inform the user but continue with role update
              if (passwordError.code === "not_admin" || passwordError.status === 403) {
                toast({
                  title: "Informacja o haśle",
                  description: "Nie masz uprawnień do zmiany hasła. Zmiana hasła wymaga uprawnień administratora w Supabase.",
                  variant: "default"
                });
                
                // Still try to update the role without updating password
                const updatedEmail = await handleRoleChange(user.id, selectedRole);
                
                if (updatedEmail) {
                  toast({
                    title: "Zmieniono uprawnienia",
                    description: `Pomyślnie zmieniono rolę użytkownika ${updatedEmail} na ${selectedRole}, ale hasło nie zostało zmienione`
                  });
                }
              } else {
                throw passwordError; // Re-throw other types of errors
              }
            }
          } else {
            const updatedEmail = await handleRoleChange(user.id, selectedRole);
            
            if (updatedEmail) {
              toast({
                title: "Zmieniono uprawnienia",
                description: `Pomyślnie zmieniono rolę użytkownika ${updatedEmail} na ${selectedRole}`
              });
            }
          }
        } catch (roleError: any) {
          console.error("Role change error:", roleError);
          throw roleError;
        }
      }
      
      fetchUsers();
      setMemberEmail('');
      setMemberPassword('');
      setSelectedRole('user');
      setSelectedMember(null);
      
    } catch (error: any) {
      console.error("Error managing user:", error);
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Nie udało się zmienić uprawnień użytkownika",
        variant: "destructive"
      });
    }
  };

  const findBestMatchingUser = (memberName: string) => {
    console.log(`Searching for user match for member: ${memberName}`);
    
    const normalizedName = memberName.toLowerCase().replace(/\s+/g, '');
    
    for (const user of users) {
      const normalizedEmail = user.email.toLowerCase().replace(/\s+/g, '');
      const nameInEmail = normalizedEmail.includes(normalizedName);
      const emailInName = normalizedName.includes(normalizedEmail);
      
      console.log(`Comparing: "${normalizedName}" with "${normalizedEmail}"`);
      console.log(`- Name in email: ${nameInEmail}, Email in name: ${emailInName}`);
      
      if (nameInEmail || emailInName) {
        console.log(`Match found: ${user.email}`);
        return user;
      }
    }
    
    const nameParts = memberName.toLowerCase().split(/\s+/);
    for (const user of users) {
      for (const part of nameParts) {
        if (part.length > 2 && user.email.toLowerCase().includes(part)) {
          console.log(`Partial match found with "${part}" in "${user.email}"`);
          return user;
        }
      }
    }
    
    console.log('No matching user found');
    return null;
  };

  const handleOpenRoleDialog = (member: Member) => {
    setSelectedMember(member);
    
    const matchedUser = findBestMatchingUser(member.name);
    
    if (matchedUser) {
      console.log(`Found matching user for ${member.name}: ${matchedUser.email} with role: ${matchedUser.role}`);
      setMemberEmail(matchedUser.email);
      setSelectedRole(matchedUser.role);
    } else {
      console.log(`No matching user found for ${member.name}, setting empty email`);
      setMemberEmail('');
      setSelectedRole('user');
    }
    
    setMemberPassword('');
  };

  const sortedMembers = [...members].sort((a, b) => {
    if (sortedAlphabetically) {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Ładowanie użytkowników...</span>
      </div>
    );
  }

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
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="Imię i nazwisko"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAddMember}>
            <Plus className="w-4 h-4 mr-2" />
            Dodaj
          </Button>
        </div>
        
        {isAdmin && (
          <div className="flex justify-end">
            <AddUserDialog 
              onSuccess={() => {
                fetchUsers();
                toast({
                  title: "Dodano użytkownika",
                  description: "Nowy użytkownik został pomyślnie dodany do systemu."
                });
              }}
              onError={(message) => {
                toast({
                  title: "Błąd",
                  description: message,
                  variant: "destructive"
                });
              }}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSort}
          className="mb-2"
        >
          <SortAsc className="w-4 h-4 mr-2" />
          {sortedAlphabetically ? 'Wyłącz sortowanie' : 'Sortuj alfabetycznie'}
        </Button>
      </div>

      <div className="space-y-3">
        {sortedMembers.map((member, index) => (
          <Card 
            key={member.id} 
            className={`p-4 flex justify-between items-center ${member.active === false ? 'opacity-50' : ''}`}
          >
            <span className="flex items-center gap-2 flex-1">
              <span className="text-sm text-muted-foreground">{index + 1}.</span>
              <span>{member.name}</span>
              {member.active === false && (
                <span className="text-sm text-red-500 font-medium ml-2">(nieaktywny)</span>
              )}
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor={`active-${member.id}`}>Aktywny</Label>
                {/*<Switch
                  id={`active-${member.id}`}
                  checked={member.active !== false}
                  onCheckedChange={() => handleToggleActive(member.id, member.name, member.active !== false)}
                />*/}
              </div>
              
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenRoleDialog(member)}
                    >
                      <UserCog className="w-4 h-4 mr-2" />
                      Uprawnienia
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Zarządzaj uprawnieniami - {selectedMember?.name}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {memberEmail ? (
                          <>
                            Wybierz rolę dla użytkownika <strong>{memberEmail}</strong>
                            {!users.find(u => u.email.toLowerCase() === memberEmail.toLowerCase()) && 
                              " (nowe konto zostanie utworzone)"}
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
                          onChange={(e) => setMemberEmail(e.target.value)} 
                          placeholder="adres@email.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="member-password">
                          {users.find(u => u.email.toLowerCase() === memberEmail.toLowerCase()) 
                            ? "Nowe hasło (opcjonalne)" 
                            : "Hasło (wymagane dla nowego konta)"}
                        </Label>
                        <Input 
                          id="member-password"
                          type="password"
                          value={memberPassword}
                          onChange={(e) => setMemberPassword(e.target.value)}
                          placeholder={users.find(u => u.email.toLowerCase() === memberEmail.toLowerCase())
                            ? "Pozostaw puste aby nie zmieniać hasła" 
                            : "Podaj hasło dla nowego konta"}
                          required={!users.find(u => u.email.toLowerCase() === memberEmail.toLowerCase())}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="member-role">Rola</Label>
                        <Select 
                          value={selectedRole} 
                          onValueChange={(value) => setSelectedRole(value as AppRole)}
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
                      <AlertDialogAction onClick={handleRoleChangeSubmit}>Zapisz</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              {/*<TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id, member.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Całkowicie usuń z systemu</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>*/}
            </div>
          </Card>
        ))}
      </div>
      
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
