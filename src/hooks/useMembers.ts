
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Member {
  id: number;
  name: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  const addMember = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .insert({ name, active: true })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setMembers(prev => [...prev, data]);
        toast({
          title: "Dodano członka",
          description: `${name} został dodany do listy.`
        });
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać członka.",
        variant: "destructive"
      });
    }
  };

  const removeMember = async (id: number) => {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setMembers(prev => prev.filter(member => member.id !== id));
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć członka.",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (id: number) => {
    try {
      const member = members.find(m => m.id === id);
      if (!member) return;
      
      const { data, error } = await supabase
        .from('members')
        .update({ active: !member.active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setMembers(prev => prev.map(m => m.id === id ? data : m));
      }
    } catch (error) {
      console.error('Error toggling member status:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zmienić statusu członka.",
        variant: "destructive"
      });
    }
  };

  // Funkcja do generowania adresu email z polskiego imienia i nazwiska
  const generateEmail = (fullName: string): string => {
    const normalize = (text: string) => {
      return text
        .toLowerCase()
        .replace(/ą/g, 'a')
        .replace(/ć/g, 'c')
        .replace(/ę/g, 'e')
        .replace(/ł/g, 'l')
        .replace(/ń/g, 'n')
        .replace(/ó/g, 'o')
        .replace(/ś/g, 's')
        .replace(/ź/g, 'z')
        .replace(/ż/g, 'z')
        .replace(/[^a-z\s]/g, '')
        .trim();
    };

    const parts = normalize(fullName).split(/\s+/);
    if (parts.length >= 2) {
      const firstName = parts[0];
      const lastName = parts[parts.length - 1];
      return `${firstName}.${lastName}@rotary.szczecin.pl`;
    }
    
    return `${normalize(fullName).replace(/\s/g, '.')}@rotary.szczecin.pl`;
  };

  const createAccountsForAllMembers = async () => {
    const password = 'naszklubrotary';
    let successCount = 0;
    let errorCount = 0;

    toast({
      title: "Rozpoczęto tworzenie kont",
      description: "Trwa tworzenie kont dla wszystkich członków..."
    });

    for (const member of members) {
      try {
        const email = generateEmail(member.name);
        console.log(`Creating account for ${member.name} with email ${email}`);

        // Sprawdź czy użytkownik już istnieje
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existingProfile) {
          console.log(`User with email ${email} already exists, skipping...`);
          continue;
        }

        // Utwórz konto użytkownika
        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name: member.name }
        });

        if (createError) {
          console.error(`Error creating user for ${member.name}:`, createError);
          errorCount++;
          continue;
        }

        if (userData.user) {
          // Dodaj profil
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userData.user.id,
              email: email
            });

          if (profileError) {
            console.error(`Error creating profile for ${member.name}:`, profileError);
            errorCount++;
            continue;
          }

          // Dodaj rolę użytkownika
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userData.user.id,
              role: 'user'
            });

          if (roleError) {
            console.error(`Error setting role for ${member.name}:`, roleError);
            // Nie liczymy tego jako błąd, profil został utworzony
          }

          successCount++;
          console.log(`Successfully created account for ${member.name} (${email})`);
        }

        // Dodaj małe opóźnienie między żądaniami
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Unexpected error for ${member.name}:`, error);
        errorCount++;
      }
    }

    toast({
      title: "Zakończono tworzenie kont",
      description: `Pomyślnie utworzono ${successCount} kont. ${errorCount > 0 ? `Błędów: ${errorCount}` : 'Wszystkie konta zostały utworzone pomyślnie!'}`
    });
  };

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    addMember,
    removeMember,
    toggleActive,
    fetchMembers,
    generateEmail,
    createAccountsForAllMembers
  };
};
