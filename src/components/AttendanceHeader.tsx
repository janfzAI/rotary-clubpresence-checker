import React from 'react';
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

interface AttendanceHeaderProps {
  date: Date;
  presentCount: number;
  totalCount: number;
  guestCount?: number;
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  date,
  presentCount,
  totalCount,
  guestCount = 0
}) => {
  return (
    <Card className="p-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">
          {date.toLocaleDateString('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-5 h-5" />
          <span>
            {presentCount} z {totalCount} członków
            {guestCount > 0 && ` + ${guestCount} gości`}
          </span>
        </div>
      </div>
    </Card>
  );
};