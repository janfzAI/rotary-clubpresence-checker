import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Guest {
  id: number;
  name: string;
  present: boolean;
}

export const useGuestsData = () => {
  const [guests, setGuests] = useState<Guest[]>([]);

  useEffect(() => {
    const fetchGuests = async () => {
      const { data, error } = await supabase.from('guests').select('*');
      if (error) {
        console.error('Error fetching guests:', error);
      } else {
        setGuests(data || []);
      }
    };

    fetchGuests();
  }, []);

  useEffect(() => {
    const saveGuests = async () => {
      const { error } = await supabase.from('guests').upsert(guests);
      if (error) {
        console.error('Error saving guests:', error);
      }
    };

    saveGuests();
  }, [guests]);

  const addGuest = (name: string) => {
    const newGuest = {
      id: guests.length > 0 ? Math.max(...guests.map(g => g.id)) + 1 : 1,
      name,
      present: false
    };
    setGuests([...guests, newGuest]);
  };

  const removeGuest = (id: number) => {
    setGuests(guests.filter(guest => guest.id !== id));
  };

  return {
    guests,
    addGuest,
    removeGuest,
    setGuests
  };
};
