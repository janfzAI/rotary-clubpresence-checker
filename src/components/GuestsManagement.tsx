import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, SortAsc } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface Guest {
  id: number;
  name: string;
  notes: string;
}

export const GuestsManagement = ({ 
  guests,
  onAddGuest,
  onRemoveGuest,
  onUpdateGuestNotes 
}: {
  guests: Guest[];
  onAddGuest: (name: string) => void;
  onRemoveGuest: (id: number) => void;
  onUpdateGuestNotes: (id: number, notes: string) => void;
}) => {
  const [newGuestName, setNewGuestName] = useState('');
  const [sortedAlphabetically, setSortedAlphabetically] = useState(false);
  const { toast } = useToast();

  const handleAddGuest = () => {
    if (newGuestName.trim()) {
      onAddGuest(newGuestName.trim());
      setNewGuestName('');
      toast({
        title: "Dodano nowego gościa",
        description: `${newGuestName} został dodany do listy.`
      });
    }
  };

  const handleRemoveGuest = (id: number, name: string) => {
    onRemoveGuest(id);
    toast({
      title: "Usunięto gościa",
      description: `${name} został usunięty z listy.`
    });
  };

  const toggleSort = () => {
    setSortedAlphabetically(!sortedAlphabetically);
    toast({
      title: "Lista posortowana",
      description: `Lista została posortowana ${!sortedAlphabetically ? 'alfabetycznie' : 'według kolejności dodawania'}.`
    });
  };

  const sortedGuests = [...guests].sort((a, b) => {
    if (sortedAlphabetically) {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Imię i nazwisko gościa"
          value={newGuestName}
          onChange={(e) => setNewGuestName(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleAddGuest}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj
        </Button>
      </div>

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

      <div className="space-y-3">
        {sortedGuests.map((guest, index) => (
          <Card key={guest.id} className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{index + 1}.</span>
                <span>{guest.name}</span>
              </span>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleRemoveGuest(guest.id, guest.name)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <Textarea
              placeholder="Uwagi"
              value={guest.notes}
              onChange={(e) => onUpdateGuestNotes(guest.id, e.target.value)}
              className="resize-none"
            />
          </Card>
        ))}
      </div>
    </div>
  );
};