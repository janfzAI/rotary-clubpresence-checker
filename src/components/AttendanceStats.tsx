import React, { useState } from 'react';
import { StatsSummaryCards } from './stats/StatsSummaryCards';
import { StatsAttendanceChart } from './stats/StatsAttendanceChart';
import { StatsMonthlyTable } from './stats/StatsMonthlyTable';

interface AttendanceRecord {
  date: Date;
  presentCount: number;
  totalCount: number;
  presentMembers?: number[];
}

interface Member {
  id: number;
  name: string;
  present: boolean;
}

export const AttendanceStats = ({ records, members }: { records: AttendanceRecord[], members: Member[] }) => {
  const currentDate = new Date();
  const pastRecords = records.filter(record => record.date <= currentDate);
  console.log('Filtered past records:', pastRecords);

  const groupedRecords = pastRecords.reduce((acc, record) => {
    const monthKey = record.date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' });
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(record);
    return acc;
  }, {} as { [key: string]: AttendanceRecord[] });

  const monthKeys = Object.keys(groupedRecords).sort((a, b) => {
    const dateA = new Date(groupedRecords[a][0].date);
    const dateB = new Date(groupedRecords[b][0].date);
    return dateA.getTime() - dateB.getTime();
  });

  const [currentMonth, setCurrentMonth] = useState(monthKeys[0]);

  const chartData = records.map(record => ({
    date: record.date.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }),
    attendance: (record.presentCount / record.totalCount) * 100
  }));

  const averageAttendance = pastRecords.length
    ? pastRecords.reduce((acc, curr) => acc + (curr.presentCount / curr.totalCount), 0) / pastRecords.length * 100
    : 0;

  const averagePresence = pastRecords.length
    ? pastRecords.reduce((acc, curr) => acc + curr.presentCount, 0) / pastRecords.length
    : 0;

  const memberStats = members.map(member => {
    const presenceCount = pastRecords.reduce((count, record) => {
      return count + (record.presentMembers?.includes(member.id) ? 1 : 0);
    }, 0);
    
    const presencePercentage = pastRecords.length > 0 
      ? (presenceCount / pastRecords.length) * 100 
      : 0;

    const totalDays = pastRecords.length > 0 
      ? Math.ceil((pastRecords[pastRecords.length - 1].date.getTime() - pastRecords[0].date.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0;

    const totalParticipation = totalDays > 0 
      ? (presenceCount / totalDays) * 100 
      : 0;

    return {
      ...member,
      presenceCount,
      presencePercentage,
      totalDays,
      totalParticipation
    };
  });

  return (
    <div className="space-y-6">
      <StatsSummaryCards 
        pastRecordsLength={pastRecords.length}
        averagePresence={averagePresence}
        averageAttendance={averageAttendance}
      />
      <StatsAttendanceChart chartData={chartData} />
      <StatsMonthlyTable 
        groupedRecords={groupedRecords}
        monthKeys={monthKeys}
        memberStats={memberStats}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
      />
    </div>
  );
};