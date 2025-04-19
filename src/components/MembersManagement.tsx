
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, SortAsc, UserCog } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";
import { AddUserDialog } from "@/components/user-roles/AddUserDialog";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Member {
  id: number;
  name: string;
  active?: boolean;
}

export const MembersManagement = ({ 
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
  const [newMemberName, setNewMemberName] = useState('');
  const [sortedAlphabetically, setSortedAlphabetically] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { users, handleMemberRoleChange, fetchUsers } = useUserRoles();
  const { isAdmin } = useAuth();

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
    if (!memberEmail || !selectedRole || !selectedMember) {
      toast({
        title: "Błąd",
        description: "Proszę podać email i wybrać rolę",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      console.log(`Attempting to manage permissions for ${selectedMember.name} with email ${memberEmail} and role ${selectedRole}`);
      
      const result = await handleMemberRoleChange(
        selectedMember.name,
        memberEmail,
        selectedRole,
        memberPassword || undefined
      );
      
      if (result) {
        // Determine if this was a new user or existing user update
        const existingUser = users.find(u => u.email.toLowerCase() === memberEmail.toLowerCase());
        const isNewUser = !existingUser;
        
        let message = `Pomyślnie ${isNewUser ? 'utworzono użytkownika' : 'zmieniono rolę użytkownika'} ${memberEmail} na ${selectedRole}`;
        if (memberPassword && result.passwordUpdated) {
          message += isNewUser ? ' z podanym hasłem' : ' i zaktualizowano hasło';
        } else if (memberPassword && !result.passwordUpdated) {
          message += '. Uwaga: Nie udało się zaktualizować hasła (wymagane uprawnienia administratora).';
        }
        
        toast({
          title: isNewUser ? "Utworzono użytkownika" : "Zmieniono uprawnienia",
          description: message
        });
        
        // Refresh users list to ensure we have the latest data
        fetchUsers();
      }
      
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const findBestMatchingUser = (memberName: string) => {
    console.log(`Searching for user match for member: ${memberName}`);
    
    // Try exact matching by converting both strings to lowercase and removing whitespace
    const normalizedName = memberName.toLowerCase().replace(/\s+/g, '');
    
    // First attempt: look for exact partial matches in either direction
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
    
    // Second attempt: look for name parts in email or vice versa
    const nameParts = memberName.toLowerCase().split(/\s+/);
    for (const user of users) {
      for (const part of nameParts) {
        if (part.length > 2 && user.email.toLowerCase().includes(part)) {
          console.log(`Partial match found with "${part}" in "${user.email}"`);
          return user;
        }
      }
    }
    
    // No match found
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
                <Switch
                  id={`active-${member.id}`}
                  checked={member.active !== false}
                  onCheckedChange={() => handleToggleActive(member.id, member.name, member.active !== false)}
                />
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
                      <AlertDialogAction 
                        onClick={handleRoleChangeSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Przetwarzanie...' : 'Zapisz'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              <TooltipProvider>
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
              </TooltipProvider>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
