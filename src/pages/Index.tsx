import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Save, Download } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { AttendanceList } from '@/components/AttendanceList';
import { AttendanceHeader } from '@/components/AttendanceHeader';
import { Navigation } from '@/components/Navigation';
import { MembersManagement } from '@/components/MembersManagement';
import { AttendanceHistory } from '@/components/AttendanceHistory';
import { AttendanceStats } from '@/components/AttendanceStats';

// Sample initial data
const initialMembers = [
  { id: 1, name: "Anna Kowalska", present: false },
  { id: 2, name: "Jan Nowak", present: false },
  { id: 3, name: "Maria Wiśniewska", present: false },
  { id: 4, name: "Piotr Zieliński", present: false },
  { id: 5, name: "Ewa Dąbrowska", present: false },
];

const sampleHistory = [
  { 
    date: new Date('2024-01-01'), 
    presentCount: 3, 
    totalCount: 5,
    presentMembers: [1, 2, 3]
  },
  { 
    date: new Date('2024-01-08'), 
    presentCount: 4, 
    totalCount: 5,
    presentMembers: [1, 2, 3, 4]
  },
  { 
    date: new Date('2024-01-15'), 
    presentCount: 5, 
    totalCount: 5,
    presentMembers: [1, 2, 3, 4, 5]
  },
  { 
    date: new Date('2024-01-22'), 
    presentCount: 3, 
    totalCount: 5,
    presentMembers: [2, 3, 5]
  },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [members, setMembers] = useState(initialMembers);
  const [history, setHistory] = useState(sampleHistory);
  const { toast } = useToast();

  const handleToggleAttendance = (id: number) => {
    setMembers(members.map(member =>
      member.id === id ? { ...member, present: !member.present } : member
    ));
  };

  const handleSave = () => {
    const presentMemberIds = members
      .filter(m => m.present)
      .map(m => m.id);

    const newRecord = {
      date: new Date(),
      presentCount: members.filter(m => m.present).length,
      totalCount: members.length,
      presentMembers: presentMemberIds
    };
    
    setHistory([...history, newRecord]);
    toast({
      title: "Zapisano obecność",
      description: `Zaktualizowano listę obecności dla ${newRecord.presentCount} osób.`,
    });
  };

  const handleAddMember = (name: string) => {
    const newId = Math.max(...members.map(m => m.id)) + 1;
    setMembers([...members, { id: newId, name, present: false }]);
  };

  const handleRemoveMember = (id: number) => {
    setMembers(members.filter(member => member.id !== id));
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Obecni', 'Wszyscy'];
    const csvContent = [
      headers.join(','),
      ...history.map(record => 
        [
          record.date.toLocaleDateString('pl-PL'),
          record.presentCount,
          record.totalCount
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'obecnosc.csv';
    link.click();
    
    toast({
      title: "Wyeksportowano dane",
      description: "Plik CSV został pobrany.",
    });
  };

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <AttendanceHeader
            date={new Date()}
            presentCount={members.filter(m => m.present).length}
            totalCount={members.length}
          />
          <AttendanceList
            members={members}
            onToggleAttendance={handleToggleAttendance}
          />
          <Button className="w-full" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Zapisz obecność
          </Button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <AttendanceHistory records={history} />
          <Button className="w-full" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Eksportuj do CSV
          </Button>
        </div>
      )}

      {activeTab === 'stats' && (
        <AttendanceStats records={history} members={members} />
      )}

      {activeTab === 'members' && (
        <MembersManagement
          members={members}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
        />
      )}
    </div>
  );
};

export default Index;