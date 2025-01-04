import React from 'react';
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface Guest {
  id: number;
  name: string;
  present: boolean;
  notes: string;
}

interface Member {
  id: number;
  name: string;
  present: boolean;
}

export const AttendanceList = ({
  members,
  guests,
  onToggleAttendance,
  onToggleGuestAttendance
}: {
  members: Member[];
  guests: Guest[];
  onToggleAttendance: (id: number) => void;
  onToggleGuestAttendance: (id: number) => void;
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Członkowie ({members.length})</h3>
        {members.map((member, index) => (
          <Card key={member.id} className="p-4 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{index + 1}.</span>
            <Checkbox
              checked={member.present}
              onCheckedChange={() => onToggleAttendance(member.id)}
            />
            <span>{member.name}</span>
          </Card>
        ))}
      </div>

      {guests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Goście ({guests.length})</h3>
          {guests.map((guest, index) => (
            <Card key={guest.id} className="p-4 flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{index + 1}.</span>
              <Checkbox
                checked={guest.present}
                onCheckedChange={() => onToggleGuestAttendance(guest.id)}
              />
              <span>{guest.name}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};