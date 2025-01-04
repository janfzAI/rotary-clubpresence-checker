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
import { useAttendanceHistory } from '@/hooks/useAttendanceHistory';
import { useAttendanceMembers } from '@/hooks/useAttendanceMembers';
import { normalizeDate } from '@/utils/dateUtils';

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

// Generowanie dat spotkań (środy) od 4 września 2024 do czerwca 2025
const startDate = new Date(2024, 8, 4); // 4 września 2024
const endDate = new Date(2025, 5, 30); // 30 czerwca 2025
const initialHistory = generateWednesdayDates(startDate, endDate).map(date => ({
  date,
  presentCount: 0,
  totalCount: initialMembers.length,
  presentMembers: []
}));

interface GuestVisit {
  date: Date;
  guestName: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = React.useState('attendance');
  const { toast } = useToast();
  const [currentMembers, setCurrentMembers] = useState(initialMembers);
  const [guests, setGuests] = useState<Array<{ id: number; name: string }>>([]);
  const [guestVisits, setGuestVisits] = useState<GuestVisit[]>([]);
  const [presentGuests, setPresentGuests] = useState<string[]>([]);
  const { history, updateHistory } = useAttendanceHistory(initialHistory, initialMembers);
  const { members, selectedDate, setSelectedDate, toggleAttendance } = useAttendanceMembers(currentMembers, history);

  const handleDateSelect = (date: Date) => {
    console.log('Handling date selection:', date);
    setSelectedDate(date);
    setActiveTab('attendance');
    
    // Reset present guests when changing date
    setPresentGuests([]);
  };

  const handleSave = () => {
    console.log('Saving attendance for date:', selectedDate);
    
    const presentMemberIds = members
      .filter(m => m.present)
      .map(m => m.id);

    const newRecord = {
      date: normalizeDate(selectedDate),
      presentCount: members.filter(m => m.present).length,
      totalCount: members.length,
      presentMembers: presentMemberIds,
      presentGuests: presentGuests
    };

    updateHistory(newRecord);
    
    // Update guest visits
    const newGuestVisits = [
      ...guestVisits,
      ...presentGuests.map(guestName => ({
        date: normalizeDate(selectedDate),
        guestName
      }))
    ];
    setGuestVisits(newGuestVisits);
    
    toast({
      title: "Zapisano obecność",
      description: `Zaktualizowano listę obecności dla ${newRecord.presentCount} osób i ${presentGuests.length} gości.`,
    });
  };

  const handleAddGuestVisit = (guestName: string) => {
    if (!presentGuests.includes(guestName)) {
      setPresentGuests([...presentGuests, guestName]);
    }
  };

  const handleAddGuest = (name: string) => {
    const newGuest = {
      id: guests.length > 0 ? Math.max(...guests.map(g => g.id)) + 1 : 1,
      name
    };
    setGuests([...guests, newGuest]);
  };

  const handleRemoveGuest = (id: number) => {
    setGuests(guests.filter(guest => guest.id !== id));
  };

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <AttendanceHeader
            date={selectedDate}
            presentCount={members.filter(m => m.present).length}
            totalCount={members.length}
            guestCount={presentGuests.length}
          />
          <AttendanceList
            members={members}
            onToggleAttendance={toggleAttendance}
            onAddGuestVisit={handleAddGuestVisit}
            presentGuests={presentGuests}
          />
          <Button className="w-full" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Zapisz obecność
          </Button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <AttendanceHistory 
            records={history} 
            onSelectDate={handleDateSelect}
          />
          <AttendanceExport history={history} />
        </div>
      )}

      {activeTab === 'stats' && (
        <AttendanceStats records={history} members={members} />
      )}

      {activeTab === 'members' && (
        <MembersManagement
          members={currentMembers}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
        />
      )}

      {activeTab === 'guests' && (
        <GuestsManagement
          guests={guests}
          onAddGuest={handleAddGuest}
          onRemoveGuest={handleRemoveGuest}
          guestVisits={guestVisits}
        />
      )}
    </div>
  );
};

export default Index;
