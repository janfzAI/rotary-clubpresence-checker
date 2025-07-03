
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useAttendanceData } from '@/hooks/useAttendanceData';
import { useGuestsData } from '@/hooks/useGuestsData';
import { useAttendanceMembers } from '@/hooks/useAttendanceMembers';
import { useMembersData } from '@/hooks/useMembersData';

export const useAttendanceState = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const { toast } = useToast();
  
  const { 
    members, 
    isLoading: membersLoading, 
    addMember: handleAddMember, 
    removeMember: handleRemoveMember, 
    toggleMemberActive: handleToggleActive 
  } = useMembersData();
  
  const { history, updateAttendance } = useAttendanceData();
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

  return {
    activeTab,
    setActiveTab,
    members,
    membersLoading,
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
