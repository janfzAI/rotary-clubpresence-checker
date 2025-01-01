import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AttendanceList } from '@/components/AttendanceList';
import { AttendanceHeader } from '@/components/AttendanceHeader';

// Sample data - replace with your actual member list
const initialMembers = [
  { id: 1, name: "Anna Kowalska", present: false },
  { id: 2, name: "Jan Nowak", present: false },
  { id: 3, name: "Maria Wiśniewska", present: false },
  { id: 4, name: "Piotr Zieliński", present: false },
  { id: 5, name: "Ewa Dąbrowska", present: false },
];

const Index = () => {
  const [members, setMembers] = useState(initialMembers);
  const { toast } = useToast();

  const handleToggleAttendance = (id: number) => {
    setMembers(members.map(member =>
      member.id === id ? { ...member, present: !member.present } : member
    ));
  };

  const handleSave = () => {
    console.log('Saving attendance:', members);
    toast({
      title: "Zapisano obecność",
      description: `Zaktualizowano listę obecności dla ${members.filter(m => m.present).length} osób.`,
    });
  };

  return (
    <div className="container max-w-md mx-auto p-4">
      <AttendanceHeader
        date={new Date()}
        presentCount={members.filter(m => m.present).length}
        totalCount={members.length}
      />
      
      <AttendanceList
        members={members}
        onToggleAttendance={handleToggleAttendance}
      />
      
      <div className="mt-6">
        <Button
          className="w-full"
          onClick={handleSave}
        >
          <Save className="w-4 h-4 mr-2" />
          Zapisz obecność
        </Button>
      </div>
    </div>
  );
};

export default Index;