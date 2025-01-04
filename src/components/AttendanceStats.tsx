import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Percent, CalendarDays } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  // Grupowanie rekordów według miesięcy
  const groupedRecords = records.reduce((acc, record) => {
    const monthKey = record.date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' });
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(record);
    return acc;
  }, {} as { [key: string]: AttendanceRecord[] });

  // Sortowanie kluczy miesięcy chronologicznie
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

  const averageAttendance = records.length
    ? records.reduce((acc, curr) => acc + (curr.presentCount / curr.totalCount), 0) / records.length * 100
    : 0;

  // Oblicz statystyki obecności dla każdego członka
  const memberStats = members.map(member => {
    const presenceCount = records.reduce((count, record) => {
      return count + (record.presentMembers?.includes(member.id) ? 1 : 0);
    }, 0);
    
    const presencePercentage = records.length > 0 
      ? (presenceCount / records.length) * 100 
      : 0;

    const totalDays = records.length > 0 
      ? Math.ceil((records[records.length - 1].date.getTime() - records[0].date.getTime()) / (1000 * 60 * 60 * 24)) + 1
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Liczba spotkań</p>
              <p className="text-2xl font-bold">{records.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Średnia obecność</p>
              <p className="text-2xl font-bold">
                {(records.reduce((acc, curr) => acc + curr.presentCount, 0) / records.length).toFixed(1)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Średnia frekwencja</p>
              <p className="text-2xl font-bold">{averageAttendance.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis unit="%" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: '#2563eb' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <Tabs defaultValue={currentMonth} onValueChange={setCurrentMonth}>
          <TabsList className="mb-4 flex flex-wrap">
            {monthKeys.map((month) => (
              <TabsTrigger key={month} value={month} className="px-4 py-2">
                {month}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {monthKeys.map((month) => (
            <TabsContent key={month} value={month} className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Członek</TableHead>
                    {groupedRecords[month].map((record, index) => (
                      <TableHead key={index} className="text-center min-w-[100px]">
                        {record.date.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' })}
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Obecności</TableHead>
                    <TableHead className="text-right">Procent</TableHead>
                    <TableHead className="text-right">Dni obecności</TableHead>
                    <TableHead className="text-right">Udział całkowity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberStats.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      {groupedRecords[month].map((record, index) => (
                        <TableCell key={index} className="text-center">
                          {record.presentMembers?.includes(member.id) ? '✓' : '—'}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-medium">{member.presenceCount}</TableCell>
                      <TableCell className="text-right font-medium">{member.presencePercentage.toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-medium">{member.presenceCount}</TableCell>
                      <TableCell className="text-right font-medium">{member.totalParticipation.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};