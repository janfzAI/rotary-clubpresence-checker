import { useState, useEffect } from 'react';
import { areDatesEqual } from '@/utils/dateUtils';

interface AttendanceRecord {
  date: Date;
  presentCount: number;
  totalCount: number;
  presentMembers?: number[];
  presentGuests?: number[];
}

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

export const useAttendanceHistory = (initialHistory: AttendanceRecord[], initialMembers: Member[]) => {
  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem('attendanceHistory');
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      return parsedHistory.map((record: any) => ({
        ...record,
        date: new Date(record.date)
      }));
    }
    return initialHistory;
  });

  useEffect(() => {
    localStorage.setItem('attendanceHistory', JSON.stringify(history));
    console.log('Historia zapisana w localStorage:', history);
  }, [history]);

  const updateHistory = (newRecord: AttendanceRecord) => {
    const existingRecordIndex = history.findIndex(record => 
      areDatesEqual(record.date, newRecord.date)
    );

    console.log('Existing record index:', existingRecordIndex);

    let updatedHistory;
    if (existingRecordIndex !== -1) {
      updatedHistory = history.map((record, index) => 
        index === existingRecordIndex ? newRecord : record
      );
      console.log('Updating existing record');
    } else {
      updatedHistory = [...history, newRecord];
      console.log('Adding new record');
    }

    setHistory(updatedHistory);
  };

  return {
    history,
    updateHistory
  };
};