import React from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AttendanceHeaderProps {
  date: Date;
  presentCount: number;
  totalCount: number;
  onDateChange: (date: Date) => void;
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  date,
  presentCount,
  totalCount,
  onDateChange,
}) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-secondary">
          <Calendar className="w-5 h-5" />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                {date.toLocaleDateString('pl-PL', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && onDateChange(newDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="text-2xl font-semibold">
        Obecnych: {presentCount} z {totalCount}
      </div>
    </div>
  );
};