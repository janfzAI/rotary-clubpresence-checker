import { useState, useEffect } from 'react';
import { areDatesEqual } from '@/utils/dateUtils';

interface Member {
  id: number;
  name: string;
  present: boolean;
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
    console.log('Selected date changed to:', selectedDate);
    console.log('Looking for record in history:', history);
    
    const record = history.find(record => areDatesEqual(record.date, selectedDate));
    console.log('Found record:', record);
    
    if (record) {
      setMembers(members.map(member => ({
        ...member,
        present: record.presentMembers?.includes(member.id) || false
      })));
      
      setGuests(guests.map(guest => ({
        ...guest,
        present: record.presentGuests?.includes(guest.id) || false
      })));
    } else {
      setMembers(members.map(member => ({ ...member, present: false })));
      setGuests(guests.map(guest => ({ ...guest, present: false })));
    }
  }, [selectedDate, history]);

  const toggleAttendance = (id: number) => {
    setMembers(members.map(member =>
      member.id === id ? { ...member, present: !member.present } : member
    ));
  };

  const toggleGuestAttendance = (id: number) => {
    setGuests(guests.map(guest =>
      guest.id === id ? { ...guest, present: !guest.present } : guest
    ));
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