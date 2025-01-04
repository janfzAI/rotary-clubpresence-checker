import React from 'react';
import { Card } from "@/components/ui/card";
import { Calendar, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttendanceRecord {
  date: Date;
  presentCount: number;
  totalCount: number;
}

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
  onSelectDate: (date: Date) => void;
}

export const AttendanceHistory = ({ records, onSelectDate }: AttendanceHistoryProps) => {
  return (
    <div className="space-y-4">
      {records.map((record, index) => (
        <Card key={index} className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span>
                {record.date.toLocaleDateString('pl-PL', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span>
                  {record.presentCount} z {record.totalCount}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSelectDate(record.date)}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Edytuj obecność
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};