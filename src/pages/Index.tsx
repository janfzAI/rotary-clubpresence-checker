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

// Lista członków Rotary Club Szczecin
const initialMembers = [
  { id: 1, name: "Bogdan Borowczyk", present: false },
  { id: 2, name: "Janusz Bykowski", present: false },
  { id: 3, name: "Wojciech Czyżewski", present: false },
  { id: 4, name: "Krzysztof Dokowski", present: false },
  { id: 5, name: "Jerzy Dominiak", present: false },
  { id: 6, name: "Włodzimierz Dominiczak", present: false },
  { id: 7, name: "Dariusz Dyczewski", present: false },
  { id: 8, name: "Artur Horn", present: false },
  { id: 9, name: "Sławomir Jaroszewicz", present: false },
  { id: 10, name: "Jan Jurga", present: false },
  { id: 11, name: "Zbigniew Kasperski", present: false },
  { id: 12, name: "Aleksandra Klich", present: false },
  { id: 13, name: "Maciej Kołban", present: false },
  { id: 14, name: "Roman Kowalewski", present: false },
  { id: 15, name: "Remigiusz Kowalski", present: false },
  { id: 16, name: "Janusz Kozłowski", present: false },
  { id: 17, name: "Maciej Krzeptowski", present: false },
  { id: 18, name: "Mirosław Lewiński", present: false },
  { id: 19, name: "Ryszard Lipka-Bartosik", present: false },
  { id: 20, name: "Agata Łakomiak", present: false },
  { id: 21, name: "Roman Łakomiak", present: false },
  { id: 22, name: "Anna Lakomiak-Melka", present: false },
  { id: 23, name: "Michał Marks", present: false },
  { id: 24, name: "Zbigniew Nagay", present: false },
  { id: 25, name: "Zbigniew Najmowicz", present: false },
  { id: 26, name: "Marek Niedbał", present: false },
  { id: 27, name: "Wiesław Paczkowski", present: false },
  { id: 28, name: "Waldemar Palt", present: false },
  { id: 29, name: "Roman Rogoziński", present: false },
  { id: 30, name: "Wojciech Soiński", present: false },
  { id: 31, name: "Lubomir Synak", present: false },
  { id: 32, name: "Piotr Szajkowski", present: false },
  { id: 33, name: "Janusz Teresiak", present: false },
  { id: 34, name: "Piotr Tobolski", present: false },
  { id: 35, name: "Marek Wróblewski", present: false },
  { id: 36, name: "Leszek Zdawski", present: false },
];

// Generowanie dat spotkań (środy) od 4 września 2024
const generateWednesdayDates = (startDate: Date, count: number) => {
  const dates = [];
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    dates.push({
      date: new Date(currentDate),
      presentCount: 0,
      totalCount: initialMembers.length,
      presentMembers: []
    });
    // Dodaj 7 dni do daty
    currentDate.setDate(currentDate.getDate() + 7);
  }
  return dates;
};

const startDate = new Date(2024, 8, 4); // 4 września 2024
const sampleHistory = generateWednesdayDates(startDate, 4); // Generuje 4 kolejne środy

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