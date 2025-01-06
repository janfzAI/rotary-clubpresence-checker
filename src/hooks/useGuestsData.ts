import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Guest {
  id: number;
  name: string;
  present: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useGuestsData = () => {
  const [guests, setGuests] = useState<Guest[]>([]);

  useEffect(() => {
    const fetchGuests = async () => {
      console.log('Fetching guests from Supabase...');
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching guests:', error);
      } else {
        console.log('Fetched guests:', data);
        setGuests(data || []);
      }
    };

    fetchGuests();
  }, []);

  const addGuest = async (name: string) => {
    console.log('Adding new guest:', name);
    const { data, error } = await supabase
      .from('guests')
      .insert([{ name, present: false }])
      .select()
      .single();

    if (error) {
      console.error('Error adding guest:', error);
    } else if (data) {
      console.log('Added guest:', data);
      setGuests([...guests, data]);
    }
  };

  const removeGuest = async (id: number) => {
    console.log('Removing guest with ID:', id);
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing guest:', error);
    } else {
      console.log('Guest removed successfully');
      setGuests(guests.filter(guest => guest.id !== id));
    }
  };

  return {
    guests,
    addGuest,
    removeGuest,
    setGuests
  };
};