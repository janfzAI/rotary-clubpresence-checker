
import { useState, useEffect } from 'react';
import { areDatesEqual } from '@/utils/dateUtils';

interface Member {
  id: number;
  name: string;
  present: boolean;
  active?: boolean;
}

interface Guest {
  id: number;
  name: string;
  present: boolean;
}

interface AttendanceRecord {
  date: Date;
  presentMembers?: number[];
  presentGuests?: number[];
}

export const useAttendanceMembers = (
  initialMembers: Member[],
  initialGuests: Guest[],
  history: AttendanceRecord[]
) => {
  const [members, setMembers] = useState(initialMembers);
  const [guests, setGuests] = useState(initialGuests);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    console.log('useAttendanceMembers - Selected date:', selectedDate);
    console.log('useAttendanceMembers - History:', history);
    
    // Najpierw resetujemy stan obecności
    const resetMembers = initialMembers.map(member => ({ ...member, present: false }));
    const resetGuests = initialGuests.map(guest => ({ ...guest, present: false }));
    
    setMembers(resetMembers);
    setGuests(resetGuests);

    // Szukamy rekordu dla wybranej daty
    const record = history.find(record => {
      // Konwertujemy obie daty do formatu YYYY-MM-DD dla porównania
      const recordDate = new Date(record.date);
      const compareDate = new Date(selectedDate);
      
      const recordStr = recordDate.toISOString().split('T')[0];
      const selectedStr = compareDate.toISOString().split('T')[0];
      
      console.log('Comparing dates:', recordStr, selectedStr);
      return recordStr === selectedStr;
    });

    console.log('useAttendanceMembers - Found record:', record);

    if (record && record.presentMembers) {
      console.log('useAttendanceMembers - Setting present members:', record.presentMembers);
      setMembers(resetMembers.map(member => ({
        ...member,
        present: record.presentMembers?.includes(member.id) || false
      })));

      if (record.presentGuests) {
        setGuests(resetGuests.map(guest => ({
          ...guest,
          present: record.presentGuests?.includes(guest.id) || false
        })));
      }
    }
  }, [selectedDate, history, initialMembers, initialGuests]);

  const toggleAttendance = (id: number) => {
    console.log('Toggling attendance for member:', id);
    setMembers(prevMembers => 
      prevMembers.map(member =>
        member.id === id ? { ...member, present: !member.present } : member
      )
    );
  };

  const toggleGuestAttendance = (id: number) => {
    console.log('Toggling attendance for guest:', id);
    setGuests(prevGuests => 
      prevGuests.map(guest =>
        guest.id === id ? { ...guest, present: !guest.present } : guest
      )
    );
  };

  return {
    members,
    guests,
    selectedDate,
    setSelectedDate,
    toggleAttendance,
    toggleGuestAttendance
  };
};
