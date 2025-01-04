import React from 'react';
import { Calendar } from 'lucide-react';

interface AttendanceHeaderProps {
  date: Date;
  presentCount: number;
  totalCount: number;
  presentGuestsCount: number;
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  date,
  presentCount,
  totalCount,
  presentGuestsCount,
}) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center space-x-2 text-secondary">
        <Calendar className="w-5 h-5" />
        <span className="text-lg">
          {date.toLocaleDateString('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-semibold">
          Obecnych: {presentCount} z {totalCount}
        </div>
        {presentGuestsCount > 0 && (
          <div className="text-lg text-muted-foreground">
            Obecnych gości: {presentGuestsCount}
          </div>
        )}
      </div>
    </div>
  );
};