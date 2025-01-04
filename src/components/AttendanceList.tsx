import React, { useState } from 'react';
import { Check, SortAsc, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

interface Member {
  id: number;
  name: string;
  present: boolean;
}

interface Guest {
  id: number;
  name: string;
}

interface AttendanceListProps {
  members: Member[];
  onToggleAttendance: (id: number) => void;
  onAddGuestVisit: (guestName: string) => void;
  presentGuests?: string[];
}

export const AttendanceList: React.FC<AttendanceListProps> = ({
  members,
  onToggleAttendance,
  onAddGuestVisit,
  presentGuests = []
}) => {
  const [sortedAlphabetically, setSortedAlphabetically] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const { toast } = useToast();

  const toggleSort = () => {
    setSortedAlphabetically(!sortedAlphabetically);
    toast({
      title: "Lista posortowana",
      description: `Lista została posortowana ${!sortedAlphabetically ? 'alfabetycznie' : 'według kolejności dodawania'}.`
    });
  };

  const handleAddGuest = () => {
    if (newGuestName.trim()) {
      onAddGuestVisit(newGuestName.trim());
      setNewGuestName('');
      toast({
        title: "Dodano gościa",
        description: `${newGuestName} został dodany do listy obecności.`
      });
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
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

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Goście</h3>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Imię i nazwisko gościa"
            value={newGuestName}
            onChange={(e) => setNewGuestName(e.target.value)}
          />
          <Button onClick={handleAddGuest}>
            <Plus className="w-4 h-4 mr-2" />
            Dodaj
          </Button>
        </div>
        {presentGuests.length > 0 && (
          <div className="space-y-2">
            {presentGuests.map((guestName, index) => (
              <Card key={index} className="p-4 bg-secondary/10">
                <div className="flex items-center justify-between">
                  <span>{guestName}</span>
                  <Check className="w-4 h-4 text-secondary" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};