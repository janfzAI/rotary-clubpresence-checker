
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
import { cn } from "@/lib/utils";

interface Member {
  id: number;
  name: string;
  presenceCount: number;
  presencePercentage: number;
  totalDays: number;
  totalParticipation: number;
  active?: boolean;
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
                {memberStats.map((member) => {
                  const isInactive = member.active === false;
                  return (
                    <TableRow key={member.id} className={cn(isInactive && "opacity-50 bg-gray-50")}>
                      <TableCell className={cn(
                        "font-medium",
                        isInactive && "text-gray-500 line-through"
                      )}>
                        {member.name}
                        {isInactive && <span className="ml-2 text-sm text-red-600 font-medium no-underline">(nieaktywny)</span>}
                      </TableCell>
                      {groupedRecords[month].map((record, index) => (
                        <TableCell key={index} className={cn(
                          "text-center",
                          isInactive && "text-gray-400"
                        )}>
                          {record.presentMembers?.includes(member.id) ? '✓' : '—'}
                        </TableCell>
                      ))}
                      <TableCell className={cn(
                        "text-right font-medium",
                        isInactive && "text-gray-500"
                      )}>
                        {member.presenceCount}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        isInactive && "text-gray-500"
                      )}>
                        {member.presencePercentage.toFixed(1)}%
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        isInactive && "text-gray-500"
                      )}>
                        {member.presenceCount}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        isInactive && "text-gray-500"
                      )}>
                        {member.totalParticipation.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
};
