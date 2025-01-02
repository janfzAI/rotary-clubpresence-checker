import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
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

      <div className="space-y-3">
        {members.map((member, index) => (
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