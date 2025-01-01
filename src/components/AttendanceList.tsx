import React from 'react';
import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Member {
  id: number;
  name: string;
  present: boolean;
}

interface AttendanceListProps {
  members: Member[];
  onToggleAttendance: (id: number) => void;
}

export const AttendanceList: React.FC<AttendanceListProps> = ({
  members,
  onToggleAttendance,
}) => {
  return (
    <div className="space-y-3">
      {members.map((member) => (
        <Card
          key={member.id}
          className={cn(
            "p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
            member.present && "bg-primary/10"
          )}
          onClick={() => onToggleAttendance(member.id)}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg">{member.name}</span>
            <div
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                member.present
                  ? "border-primary bg-primary text-white"
                  : "border-gray-300"
              )}
            >
              {member.present && (
                <Check className="w-4 h-4 animate-check-mark" />
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};