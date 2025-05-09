
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, AlertTriangle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MemberRoleDialog } from "./members/MemberRoleDialog";
import { useMemberRoleManagement } from "@/hooks/useMemberRoleManagement";
import type { AppRole } from '@/types/userRoles';

interface Manager {
  id: string;
  email: string;
  name?: string;
  fullName?: string;
}

export const ManagersList = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailConflicts, setEmailConflicts] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Get the role management hook
  const {
    selectedMember,
    selectedRole,
    memberEmail,
    memberPassword,
    isSubmitting,
    users,
    handleRoleChangeSubmit,
    handleOpenRoleDialog,
    handleCloseDialog,
    setMemberEmail,
    setMemberPassword,
    setSelectedRole,
    refreshUserData,
    memberEmailMappings,
    lastRefreshTimestamp
  } = useMemberRoleManagement();

  const fetchManagers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching managers from database...");
      
      // First refresh the user data to get the latest roles
      await refreshUserData();
      
      // Get all users with manager role from user_roles table
      const { data: managerRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'manager');
      
      if (rolesError) {
        console.error("Error fetching manager roles:", rolesError);
        throw rolesError;
      }
      
      if (!managerRoles || managerRoles.length === 0) {
        console.log("No managers found in the database");
        setManagers([]);
        return;
      }
      
      console.log(`Found ${managerRoles.length} managers, fetching their profile information...`);
      
      // Extract user IDs
      const managerIds = managerRoles.map(role => role.user_id);
      
      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', managerIds);
        
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }
      
      console.log(`Retrieved ${profiles?.length || 0} manager profiles`);
      
      if (profiles) {
        const managersList = profiles.map(profile => {
          const email = profile.email || '';
          const userId = profile.id;
          
          // Extract name from email if no mapping exists
          let firstName = email.split('@')[0].split('.')[0];
          firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
          
          // Extract full name from email or known mappings
          let fullName = '';
          
          // Look for full name in mappings
          for (const [mappingKey, mappingEmail] of Object.entries(memberEmailMappings)) {
            if (mappingEmail.toLowerCase() === email.toLowerCase()) {
              // If the key is a number, it's a member ID, otherwise it might be a name
              if (isNaN(Number(mappingKey))) {
                fullName = mappingKey;
              }
            }
          }
          
          // If no mapping found, create a name from the email
          if (!fullName) {
            const nameParts = email.split('@')[0].split('.');
            
            if (nameParts.length >= 2) {
              // If email follows format like firstname.lastname@domain.com
              fullName = nameParts
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ');
            } else {
              // If email doesn't have a separator, use what we have
              fullName = firstName;
            }
          }
          
          return {
            id: userId,
            email: email,
            // First name only
            name: firstName,
            // Full name
            fullName: fullName
          };
        });
        
        // Check for first name conflicts
        const firstNames = managersList.map(manager => manager.name?.toLowerCase());
        const conflicts = firstNames.filter(
          (name, index) => firstNames.indexOf(name) !== index
        );
        
        setEmailConflicts([...new Set(conflicts)]);
        setManagers(managersList);
      }
    } catch (error) {
      console.error("Error in fetchManagers:", error);
      setError("Wystąpił błąd podczas pobierania listy managerów.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch managers on initial load and when refresh counter changes
  useEffect(() => {
    fetchManagers();
  }, [refreshCounter, lastRefreshTimestamp]);
  
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    console.log(`Copied to clipboard: ${email}`);
  };

  const handleOpenManagerRoleDialog = (manager: Manager) => {
    setSelectedManager(manager);
    console.log("Opening dialog for manager:", manager);
    
    // Convert String ID to Number for compatibility with MemberRoleDialog
    const memberId = parseInt(manager.id) || Math.floor(Math.random() * 10000);
    
    // Create member object in the format expected by handleOpenRoleDialog
    const memberData = {
      id: memberId,
      name: manager.fullName || manager.name || manager.email.split('@')[0],
      active: true
    };
    
    // Log the actual member data being passed
    console.log("Member data being passed to handleOpenRoleDialog:", memberData);
    
    // Open the role dialog with the selected manager
    handleOpenRoleDialog(memberData);
    setDialogOpen(true);
  };

  const handleCloseManagerDialog = () => {
    handleCloseDialog();
    setDialogOpen(false);
    setSelectedManager(null);
  };

  const handleRoleSubmit = async () => {
    await handleRoleChangeSubmit();
    setDialogOpen(false);
    
    // Force refresh after a short delay to ensure database changes are applied
    setTimeout(() => {
      console.log("Forcing manager list refresh after role change");
      setRefreshCounter(prev => prev + 1);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Użytkownicy z uprawnieniami managera</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setRefreshCounter(prev => prev + 1);
          }}
          disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Odśwież
            </>
          )}
        </Button>
      </div>
      
      {emailConflicts.length > 0 && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Wykryto potencjalne konflikty imion:</p>
            <ul className="list-disc pl-5 mt-2">
              {emailConflicts.map((name, i) => (
                <li key={i}>Imię "{name}" występuje więcej niż raz</li>
              ))}
            </ul>
            <p className="mt-2">
              Upewnij się, że użytkownicy są identyfikowani po pełnym imieniu i nazwisku.
            </p>
          </AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="p-4 border border-red-300 rounded bg-red-50 text-red-700">
          {error}
        </div>
      ) : managers.length === 0 ? (
        <div className="p-4 border rounded text-center text-muted-foreground">
          Brak użytkowników z uprawnieniami managera w systemie.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lp.</TableHead>
              <TableHead>Pełna nazwa</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>ID użytkownika</TableHead>
              <TableHead>Uprawnienia</TableHead>
              <TableHead>Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {managers.map((manager, index) => (
              <TableRow key={manager.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{manager.fullName || "Nieznany"}</TableCell>
                <TableCell>{manager.email}</TableCell>
                <TableCell>
                  <span className="text-xs font-mono">{manager.id.substring(0, 8)}...</span>
                </TableCell>
                <TableCell>
                  <Badge variant="info">Manager</Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyEmail(manager.email)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Kopiuj adres email</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleOpenManagerRoleDialog(manager)}
                  >
                    Uprawnienia
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      
      <div className="text-sm text-muted-foreground">
        Liczba managerów: {managers.length}
      </div>

      {/* MemberRoleDialog integration */}
      <MemberRoleDialog
        isOpen={dialogOpen}
        selectedMember={selectedMember}
        memberEmail={memberEmail}
        selectedRole={selectedRole}
        memberPassword={memberPassword}
        isSubmitting={isSubmitting}
        users={users}
        onClose={handleCloseManagerDialog}
        onSubmit={handleRoleSubmit}
        onEmailChange={setMemberEmail}
        onPasswordChange={setMemberPassword}
        onRoleChange={setSelectedRole}
      />
    </div>
  );
};
