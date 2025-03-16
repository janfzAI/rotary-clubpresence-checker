
import React from 'react';
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Member {
  id: number;
  name: string;
  presenceCount: number;
  presencePercentage: number;
  totalDays: number;
  totalParticipation: number;
}

interface AttendanceRecord {
  date: Date;
  presentMembers?: number[];
}

interface GroupedRecords {
  [key: string]: AttendanceRecord[];
}

interface StatsMonthlyTableProps {
  groupedRecords: GroupedRecords;
  monthKeys: string[];
  memberStats: Member[];
  currentMonth: string;
  onMonthChange: (month: string) => void;
}

export const StatsMonthlyTable = ({
  groupedRecords,
  monthKeys,
  memberStats,
  currentMonth,
  onMonthChange
}: StatsMonthlyTableProps) => {
  return (
    <Card className="p-4">
      <Tabs defaultValue={currentMonth} onValueChange={onMonthChange}>
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
                  {groupedRecords[month].map((record, index) => {
                    const recordDate = record.date instanceof Date ? record.date : new Date(record.date);
                    const isSpecialFriday = recordDate.toISOString().split('T')[0] === '2025-03-21';
                    return (
                      <TableHead key={index} className="text-center min-w-[100px]">
                        {recordDate.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' })}
                        {isSpecialFriday && ' (pt)'}
                      </TableHead>
                    );
                  })}
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
  );
};
