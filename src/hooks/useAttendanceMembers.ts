
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
    console.log('useAttendanceMembers - Current members state:', members);
    
    const record = history.find(record => {
      const areEqual = areDatesEqual(new Date(record.date), selectedDate);
      console.log('Comparing dates:', new Date(record.date), selectedDate, areEqual);
      return areEqual;
    });
    
    console.log('useAttendanceMembers - Found record:', record);
    
    // Resetuj stan obecności przed ustawieniem nowych wartości
    setMembers(members.map(member => ({ ...member, present: false })));
    setGuests(guests.map(guest => ({ ...guest, present: false })));

    if (record) {
      console.log('useAttendanceMembers - Setting present members:', record.presentMembers);
      setMembers(members.map(member => ({
        ...member,
        present: record.presentMembers?.includes(member.id) || false
      })));
      
      setGuests(guests.map(guest => ({
        ...guest,
        present: record.presentGuests?.includes(guest.id) || false
      })));
    }
  }, [selectedDate, history]);

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
