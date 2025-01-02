import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, SortAsc } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface Member {
  id: number;
  name: string;
}

export const MembersManagement = ({ 
  members,
  onAddMember,
  onRemoveMember 
}: {
  members: Member[];
  onAddMember: (name: string) => void;
  onRemoveMember: (id: number) => void;
}) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [sortedAlphabetically, setSortedAlphabetically] = useState(false);
  const { toast } = useToast();

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      onAddMember(newMemberName.trim());
      setNewMemberName('');
      toast({
        title: "Dodano nowego członka",
        description: `${newMemberName} został dodany do listy.`
      });
    }
  };

  const handleRemoveMember = (id: number, name: string) => {
    onRemoveMember(id);
    toast({
      title: "Usunięto członka",
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

  const sortedMembers = [...members].sort((a, b) => {
    if (sortedAlphabetically) {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Imię i nazwisko"
          value={newMemberName}
          onChange={(e) => setNewMemberName(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleAddMember}>
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
        {sortedMembers.map((member, index) => (
          <Card key={member.id} className="p-4 flex justify-between items-center">
            <span className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{index + 1}.</span>
              <span>{member.name}</span>
            </span>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleRemoveMember(member.id, member.name)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};