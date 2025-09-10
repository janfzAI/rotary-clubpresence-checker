
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useAttendanceData } from '@/hooks/useAttendanceData';
import { useGuestsData } from '@/hooks/useGuestsData';
import { useAttendanceMembers } from '@/hooks/useAttendanceMembers';
import { normalizeDate, RotaryYear } from '@/utils/dateUtils';

export interface Member {
  id: number;
  name: string;
  present: boolean;
  active: boolean;
}

const initialMembers = [
  { id: 1, name: "Bogdan Borowczyk", present: false, active: true },
  { id: 2, name: "Janusz Bykowski", present: false, active: true },
  { id: 3, name: "Krzysztof Meisinger", present: false, active: true },
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
  { id: 14, name: "Mirosław Moroz", present: false, active: true },
  { id: 15, name: "Remigiusz Kowalski", present: false, active: true },
  { id: 16, name: "Janusz Kozłowski", present: false, active: true },
  { id: 17, name: "Maciej Krzeptowski", present: false, active: true },
  { id: 18, name: "Mirosław Lewiński", present: false, active: true },
  { id: 19, name: "Ryszard Lipka-Bartosik", present: false, active: true },
  { id: 20, name: "Agata Łakomiak left", present: false, active: true },
  { id: 21, name: "Roman Łakomiak", present: false, active: true },
  { id: 22, name: "Anna Lakomiak-Melka left", present: false, active: true },
  { id: 23, name: "Michał Marks", present: false, active: true },
  { id: 24, name: "Zbigniew Nagay", present: false, active: true },
  { id: 25, name: "Zbigniew Najmowicz", present: false, active: true },
  { id: 26, name: "Marek Niedbał", present: false, active: true },
  { id: 27, name: "Wiesław Paczkowski", present: false, active: true },
  { id: 28, name: "Waldemar Palt", present: false, active: true },
  { id: 29, name: "Roman Rogoziński", present: false, active: true },
  { id: 30, name: "Wojciech Soiński", present: false, active: true },
  { id: 31, name: "Lubomir Synak", present: false, active: true },
  { id: 32, name: "Piotr Szajkowski left", present: false, active: true },
  { id: 33, name: "Janusz Teresiak", present: false, active: true },
  { id: 34, name: "Piotr Tobolski", present: false, active: true },
  { id: 35, name: "Marek Wróblewski", present: false, active: true },
  { id: 36, name: "Leszek Zdawski", present: false, active: true },
];

export const useAttendanceState = (rotaryYear: RotaryYear = '2025/2026') => {
  const [activeTab, setActiveTab] = useState('attendance');
  const { toast } = useToast();
  const [members, setMembers] = useState(initialMembers);
  const { history, updateAttendance } = useAttendanceData(rotaryYear);
  const { guests, addGuest, removeGuest } = useGuestsData();
  
  const { 
    members: attendanceMembers, 
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

  return {
    activeTab,
    setActiveTab,
    members,
    attendanceMembers,
    attendanceGuests,
    selectedDate,
    history,
    updateAttendance,
    guests,
    addGuest,
    removeGuest,
    handleDateSelect,
    handleAddMember,
    handleRemoveMember,
    handleToggleActive,
    toggleAttendance,
    toggleGuestAttendance,
    toast
  };
};
