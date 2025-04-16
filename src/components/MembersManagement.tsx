
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
  const { toast } = useToast();
  const { users, handleRoleChange } = useUserRoles();
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
    if (!memberEmail || !selectedRole) {
      toast({
        title: "Błąd",
        description: "Proszę podać email i wybrać rolę",
        variant: "destructive"
      });
      return;
    }

    try {
      // Find user by email
      const user = users.find(u => u.email.toLowerCase() === memberEmail.toLowerCase());
      
      if (!user) {
        toast({
          title: "Błąd",
          description: "Nie znaleziono użytkownika o podanym adresie email",
          variant: "destructive"
        });
        return;
      }

      const email = await handleRoleChange(user.id, selectedRole);
      
      if (email) {
        toast({
          title: "Zmieniono uprawnienia",
          description: `Pomyślnie zmieniono rolę użytkownika ${email} na ${selectedRole}`
        });
        
        // Reset form
        setMemberEmail('');
        setSelectedRole('user');
        setSelectedMember(null);
      }
    } catch (error) {
      console.error("Error changing role:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się zmienić uprawnień użytkownika",
        variant: "destructive"
      });
    }
  };

  const handleOpenRoleDialog = (member: Member) => {
    setSelectedMember(member);
    
    // Find if this member has an associated user
    const existingUser = users.find(u => u.email.toLowerCase().includes(member.name.toLowerCase()));
    
    if (existingUser) {
      setMemberEmail(existingUser.email);
      setSelectedRole(existingUser.role);
    } else {
      setMemberEmail('');
      setSelectedRole('user');
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    if (sortedAlphabetically) {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
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
                        Przypisz rolę do użytkownika w systemie poprzez podanie adresu email i wybranie roli.
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
