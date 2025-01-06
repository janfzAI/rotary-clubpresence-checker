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
    // For now, we'll keep guests in memory since they're temporary
    // In the future, we could add a guests table to Supabase if needed
    const savedGuests = localStorage.getItem('guests');
    if (savedGuests) {
      setGuests(JSON.parse(savedGuests));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('guests', JSON.stringify(guests));
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
