import React from 'react';
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Percent, CalendarDays } from 'lucide-react';

interface AttendanceRecord {
  date: Date;
  presentCount: number;
  totalCount: number;
}

export const AttendanceStats = ({ records }: { records: AttendanceRecord[] }) => {
  const chartData = records.map(record => ({
    date: record.date.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }),
    attendance: (record.presentCount / record.totalCount) * 100
  }));

  const averageAttendance = records.length
    ? records.reduce((acc, curr) => acc + (curr.presentCount / curr.totalCount), 0) / records.length * 100
    : 0;

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
                {records.reduce((acc, curr) => acc + curr.presentCount, 0) / records.length}
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
    </div>
  );
};