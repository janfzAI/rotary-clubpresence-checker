import React from 'react';
import { Card } from "@/components/ui/card";
import { Users, Percent, CalendarDays } from 'lucide-react';

interface StatsSummaryCardsProps {
  pastRecordsLength: number;
  averagePresence: number;
  averageAttendance: number;
}

export const StatsSummaryCards = ({ 
  pastRecordsLength, 
  averagePresence, 
  averageAttendance 
}: StatsSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Liczba spotkań</p>
            <p className="text-2xl font-bold">{pastRecordsLength}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Średnia obecność</p>
            <p className="text-2xl font-bold">{averagePresence.toFixed(1)}</p>
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
  );
};