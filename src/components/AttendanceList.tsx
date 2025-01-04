import React, { useState } from 'react';
import { Check, SortAsc } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";

interface Member {
  id: number;
  name: string;
  present: boolean;
}

interface AttendanceListProps {
  members: Member[];
  onToggleAttendance: (id: number) => void;
  guests: string[];
  onGuestsChange: (guests: string[]) => void;
}

export const AttendanceList: React.FC<AttendanceListProps> = ({
  members,
  onToggleAttendance,
  guests,
  onGuestsChange,
}) => {
  const [sortedAlphabetically, setSortedAlphabetically] = useState(false);
  const [newGuest, setNewGuest] = useState('');
  const { toast } = useToast();

  const toggleSort = () => {
    setSortedAlphabetically(!sortedAlphabetically);
    toast({
      title: "Lista posortowana",
      description: `Lista została posortowana ${!sortedAlphabetically ? 'alfabetycznie' : 'według kolejności dodawania'}.`
    });
  };

  const handleAddGuest = () => {
    if (newGuest.trim()) {
      onGuestsChange([...guests, newGuest.trim()]);
      setNewGuest('');
      toast({
        title: "Dodano gościa",
        description: `${newGuest.trim()} został dodany do listy gości.`
      });
    }
  };

  const handleRemoveGuest = (index: number) => {
    const updatedGuests = guests.filter((_, i) => i !== index);
    onGuestsChange(updatedGuests);
    toast({
      title: "Usunięto gościa",
      description: "Gość został usunięty z listy."
    });
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
            <span className="text-lg">{index + 1}. {member.name}</span>
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

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Goście</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newGuest}
            onChange={(e) => setNewGuest(e.target.value)}
            placeholder="Imię i nazwisko gościa"
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <Button onClick={handleAddGuest}>Dodaj gościa</Button>
        </div>
        {guests.map((guest, index) => (
          <Card key={index} className="p-4 mb-2">
            <div className="flex justify-between items-center">
              <span>{guest}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveGuest(index)}
              >
                Usuń
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};