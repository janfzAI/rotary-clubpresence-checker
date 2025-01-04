import React from 'react';
import { Card } from "@/components/ui/card";
import { Calendar, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      {records.map((record, index) => {
        // Konwertuj string na obiekt Date, jeśli to konieczne
        const recordDate = record.date instanceof Date ? record.date : new Date(record.date);
        
        return (
          <Card 
            key={index} 
            className={cn(
              "p-4",
              record.presentCount >= 2 && "bg-primary/10"
            )}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span>
                  {recordDate.toLocaleDateString('pl-PL', {
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
                  onClick={() => {
                    console.log('Clicking edit for date:', recordDate);
                    onSelectDate(recordDate);
                  }}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Edytuj obecność
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};