
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail } from "lucide-react";
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

interface Manager {
  id: string;
  email: string;
  name?: string;
}

export const ManagersList = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching managers from database...");
      
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
        setManagers(profiles.map(profile => ({
          id: profile.id,
          email: profile.email,
          // Extract name from email if possible
          name: profile.email.split('@')[0].replace('.', ' ').split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        })));
      }
    } catch (error) {
      console.error("Error in fetchManagers:", error);
      setError("Wystąpił błąd podczas pobierania listy managerów.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);
  
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    // You could add a toast notification here
    console.log(`Copied to clipboard: ${email}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Użytkownicy z uprawnieniami managera</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchManagers}
          disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Odśwież"}
        </Button>
      </div>
      
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
              <TableHead>Nazwa użytkownika</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Uprawnienia</TableHead>
              <TableHead>Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {managers.map((manager, index) => (
              <TableRow key={manager.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{manager.name || "Nieznany"}</TableCell>
                <TableCell>{manager.email}</TableCell>
                <TableCell>
                  <Badge variant="info">Manager</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyEmail(manager.email)}
                    title="Kopiuj adres email"
                  >
                    <Mail className="h-4 w-4" />
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
    </div>
  );
};
