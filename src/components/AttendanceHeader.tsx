import React from 'react';
import { Calendar } from 'lucide-react';

interface AttendanceHeaderProps {
  date: Date;
  presentCount: number;
  totalCount: number;
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  date,
  presentCount,
  totalCount,
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
      <div className="text-2xl font-semibold">
        Obecnych: {presentCount} z {totalCount}
      </div>
    </div>
  );
};