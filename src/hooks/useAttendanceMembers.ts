import { useState, useEffect } from 'react';
import { areDatesEqual } from '@/utils/dateUtils';

interface Member {
  id: number;
  name: string;
  present: boolean;
}

interface AttendanceRecord {
  date: Date;
  presentMembers?: number[];
}

export const useAttendanceMembers = (initialMembers: Member[], history: AttendanceRecord[]) => {
  const [members, setMembers] = useState(initialMembers);
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
    } else {
      setMembers(members.map(member => ({ ...member, present: false })));
    }
  }, [selectedDate, history]);

  const toggleAttendance = (id: number) => {
    setMembers(members.map(member =>
      member.id === id ? { ...member, present: !member.present } : member
    ));
  };

  return {
    members,
    selectedDate,
    setSelectedDate,
    toggleAttendance
  };
};