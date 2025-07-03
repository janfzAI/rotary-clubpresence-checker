
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface Member {
  id: number;
  name: string;
  present: boolean;
  active: boolean;
}

export const useMembersData = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching members:', error);
        toast({
          title: "Błąd",
          description: "Nie udało się pobrać listy członków",
          variant: "destructive"
        });
        return;
      }

      const membersWithPresence = data.map(member => ({
        ...member,
        present: false,
        active: member.active ?? true
      }));

      setMembers(membersWithPresence);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać listy członków",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addMember = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .insert([{ name, active: true }])
        .select()
        .single();

      if (error) {
        console.error('Error adding member:', error);
        toast({
          title: "Błąd",
          description: "Nie udało się dodać członka",
          variant: "destructive"
        });
        return;
      }

      const newMember = {
        ...data,
        present: false,
        active: data.active ?? true
      };

      setMembers(prev => [...prev, newMember]);
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać członka",
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

      if (error) {
        console.error('Error removing member:', error);
        toast({
          title: "Błąd",
          description: "Nie udało się usunąć członka",
          variant: "destructive"
        });
        return;
      }

      setMembers(prev => prev.filter(member => member.id !== id));
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć członka",
        variant: "destructive"
      });
    }
  };

  const toggleMemberActive = async (id: number) => {
    try {
      const member = members.find(m => m.id === id);
      if (!member) return;

      const newActiveStatus = !member.active;

      const { error } = await supabase
        .from('members')
        .update({ active: newActiveStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating member status:', error);
        toast({
          title: "Błąd",
          description: "Nie udało się zaktualizować statusu członka",
          variant: "destructive"
        });
        return;
      }

      setMembers(prev => prev.map(member =>
        member.id === id ? { ...member, active: newActiveStatus } : member
      ));
    } catch (error) {
      console.error('Error updating member status:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować statusu członka",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return {
    members,
    isLoading,
    addMember,
    removeMember,
    toggleMemberActive,
    refreshMembers: fetchMembers
  };
};
