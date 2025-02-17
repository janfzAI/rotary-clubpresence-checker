import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { AttendanceList } from '@/components/AttendanceList';
import { AttendanceHeader } from '@/components/AttendanceHeader';
import { Navigation } from '@/components/Navigation';
import { MembersManagement } from '@/components/MembersManagement';
import { GuestsManagement } from '@/components/GuestsManagement';
import { AttendanceHistory } from '@/components/AttendanceHistory';
import { AttendanceStats } from '@/components/AttendanceStats';
import { AttendanceExport } from '@/components/AttendanceExport';
import { useAttendanceMembers } from '@/hooks/useAttendanceMembers';
import { useAttendanceData } from '@/hooks/useAttendanceData';
import { useGuestsData } from '@/hooks/useGuestsData';
import { normalizeDate } from '@/utils/dateUtils';

const initialMembers = [
  { id: 1, name: "Bogdan Borowczyk", present: false, active: true },
  { id: 2, name: "Janusz Bykowski", present: false, active: true },
  { id: 3, name: "Wojciech Czyżewski", present: false, active: true },
  { id: 4, name: "Krzysztof Dokowski", present: false, active: true },
  { id: 5, name: "Jerzy Dominiak", present: false, active: true },
  { id: 6, name: "Włodzimierz Dominiczak", present: false, active: true },
  { id: 7, name: "Dariusz Dyczewski", present: false, active: true },
  { id: 8, name: "Artur Horn", present: false, active: true },
  { id: 9, name: "Sławomir Jaroszewicz", present: false, active: true },
  { id: 10, name: "Jan Jurga", present: false, active: true },
  { id: 11, name: "Zbigniew Kasperski", present: false, active: true },
  { id: 12, name: "Aleksandra Klich", present: false, active: true },
  { id: 13, name: "Maciej Kołban", present: false, active: true },
  { id: 14, name: "Mirek Moroz", present: false, active: true },
  { id: 15, name: "Remigiusz Kowalski", present: false, active: true },
  { id: 16, name: "Janusz Kozłowski", present: false, active: true },
  { id: 17, name: "Maciej Krzeptowski", present: false, active: true },
  { id: 18, name: "Mirosław Lewiński", present: false, active: true },
  { id: 19, name: "Ryszard Lipka-Bartosik", present: false, active: true },
  { id: 20, name: "Agata Łakomiak", present: false, active: true },
  { id: 21, name: "Roman Łakomiak", present: false, active: true },
  { id: 22, name: "Anna Lakomiak-Melka", present: false, active: true },
  { id: 23, name: "Michał Marks", present: false, active: true },
  { id: 24, name: "Zbigniew Nagay", present: false, active: true },
  { id: 25, name: "Zbigniew Najmowicz", present: false, active: true },
  { id: 26, name: "Marek Niedbał", present: false, active: true },
  { id: 27, name: "Wiesław Paczkowski", present: false, active: true },
  { id: 28, name: "Waldemar Palt", present: false, active: true },
  { id: 29, name: "Roman Rogoziński", present: false, active: true },
  { id: 30, name: "Wojciech Soiński", present: false, active: true },
  { id: 31, name: "Lubomir Synak", present: false, active: true },
  { id: 32, name: "Piotr Szajkowski", present: false, active: true },
  { id: 33, name: "Janusz Teresiak", present: false, active: true },
  { id: 34, name: "Piotr Tobolski", present: false, active: true },
  { id: 35, name: "Marek Wróblewski", present: false, active: true },
  { id: 36, name: "Leszek Zdawski", present: false, active: true },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const { toast } = useToast();
  const [members, setMembers] = useState(initialMembers);
  const { history, updateAttendance } = useAttendanceData();
  const { guests, addGuest, removeGuest, setGuests } = useGuestsData();
  
  const { 
    guests: attendanceGuests, 
    selectedDate, 
    setSelectedDate, 
    toggleAttendance,
    toggleGuestAttendance 
  } = useAttendanceMembers(members, guests, history);

  const handleDateSelect = (date: Date) => {
    console.log('Handling date selection:', date);
    setSelectedDate(date);
    setActiveTab('attendance');
  };

  const generateAttendanceFile = (date: Date) => {
    const formattedDate = date.toLocaleDateString('pl-PL').replace(/\./g, '_');
    const presentMembers = members.filter(m => m.present);
    const presentGuests = attendanceGuests.filter(g => g.present);
    
    let content = `Lista obecności - ${date.toLocaleDateString('pl-PL')}\n\n`;
    content += `Obecni członkowie (${presentMembers.length} z ${members.length}):\n`;
    presentMembers.forEach((member, index) => {
      content += `${index + 1}. ${member.name}\n`;
    });
    
    if (presentGuests.length > 0) {
      content += `\nObecni goście (${presentGuests.length}):\n`;
      presentGuests.forEach((guest, index) => {
        content += `${index + 1}. ${guest.name}\n`;
      });
    }
    
    content += `\nNieobecni:\n`;
    members.filter(m => !m.present).forEach((member, index) => {
      content += `${index + 1}. ${member.name}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `obecnosc_${formattedDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    console.log('Saving attendance for date:', selectedDate);
    
    const presentMemberIds = members
      .filter(m => m.present)
      .map(m => m.id);

    const presentGuestIds = attendanceGuests
      .filter(g => g.present)
      .map(g => g.id);

    const newRecord = {
      date: normalizeDate(selectedDate),
      presentCount: members.filter(m => m.present).length,
      totalCount: members.length,
      presentMembers: presentMemberIds,
      presentGuests: presentGuestIds
    };

    try {
      await updateAttendance.mutateAsync(newRecord);
      generateAttendanceFile(selectedDate);
      
      toast({
        title: "Zapisano obecność",
        description: `Zaktualizowano listę obecności dla ${newRecord.presentCount} członków i ${presentGuestIds.length} gości.`,
      });
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: "Błąd zapisu",
        description: "Nie udało się zapisać obecności. Spróbuj ponownie.",
        variant: "destructive"
      });
    }
  };

  const handleAddMember = (name: string) => {
    const newMember = {
      id: members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1,
      name,
      present: false,
      active: true
    };
    setMembers([...members, newMember]);
  };

  const handleRemoveMember = (id: number) => {
    setMembers(members.filter(member => member.id !== id));
  };

  const handleToggleActive = (id: number) => {
    setMembers(members.map(member =>
      member.id === id ? { ...member, active: !member.active } : member
    ));
  };

  return (
    <div className="container mx-auto p-4 w-[80%] lg:max-w-6xl xl:max-w-7xl">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <AttendanceHeader
            date={selectedDate}
            presentCount={members.filter(m => m.present).length}
            totalCount={members.length}
            presentGuestsCount={attendanceGuests.filter(g => g.present).length}
          />
          <AttendanceList
            members={members}
            guests={attendanceGuests}
            onToggleAttendance={toggleAttendance}
            onToggleGuestAttendance={toggleGuestAttendance}
          />
          <Button 
            className="w-full" 
            onClick={handleSave}
            disabled={updateAttendance.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateAttendance.isPending ? 'Zapisywanie...' : 'Zapisz obecność'}
          </Button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <AttendanceHistory 
            records={history} 
            onSelectDate={handleDateSelect}
          />
          <AttendanceExport history={history} members={members} />
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
          onToggleActive={handleToggleActive}
        />
      )}

      {activeTab === 'guests' && (
        <GuestsManagement
          guests={guests}
          onAddGuest={addGuest}
          onRemoveGuest={removeGuest}
        />
      )}
    </div>
  );
};

export default Index;
