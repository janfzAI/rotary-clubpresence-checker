import React, { useState } from 'react';
import { Check, SortAsc } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";

interface Member {
  id: number;
  name: string;
  present: boolean;
}

interface Guest {
  id: number;
  name: string;
  present: boolean;
}

interface AttendanceListProps {
  members: Member[];
  guests: Guest[];
  onToggleAttendance: (id: number) => void;
  onToggleGuestAttendance: (id: number) => void;
}

export const AttendanceList: React.FC<AttendanceListProps> = ({
  members,
  guests,
  onToggleAttendance,
  onToggleGuestAttendance,
}) => {
  const [sortedAlphabetically, setSortedAlphabetically] = useState(false);
  const { toast } = useToast();

  const toggleSort = () => {
    setSortedAlphabetically(!sortedAlphabetically);
    toast({
      title: "Lista posortowana",
      description: `Lista została posortowana ${!sortedAlphabetically ? 'alfabetycznie' : 'według kolejności dodawania'}.`
    });
  };

  const sortedMembers = [...members].sort((a, b) => {
    if (sortedAlphabetically) {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const sortedGuests = [...guests].sort((a, b) => {
    if (sortedAlphabetically) {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSort}
          className="mb-2"
        >
          <SortAsc className="w-4 h-4 mr-2" />
          {sortedAlphabetically ? 'Wyłącz sortowanie' : 'Sortuj alfabetycznie'}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Członkowie</h3>
          {sortedMembers.map((member, index) => (
            <Card
              key={member.id}
              className={cn(
                "p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
                member.present && "bg-primary/10"
              )}
              onClick={() => onToggleAttendance(member.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">
                  {index + 1}. {member.name}
                </span>
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

        {guests.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Goście</h3>
              {sortedGuests.map((guest, index) => (
                <Card
                  key={guest.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
                    guest.present && "bg-secondary/10"
                  )}
                  onClick={() => onToggleGuestAttendance(guest.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">
                      {index + 1}. {guest.name}
                    </span>
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                        guest.present
                          ? "border-secondary bg-secondary text-white"
                          : "border-gray-300"
                      )}
                    >
                      {guest.present && (
                        <Check className="w-4 h-4 animate-check-mark" />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};