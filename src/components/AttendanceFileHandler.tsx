
import React from 'react';
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';
import { normalizeDate } from '@/utils/dateUtils';
import { Member } from '@/hooks/useAttendanceState';

interface AttendanceFileHandlerProps {
  selectedDate: Date;
  attendanceMembers: Member[];
  attendanceGuests: any[];
  updateAttendance: any;
  onSaveSuccess: (presentCount: number, presentGuestsCount: number) => void;
  onSaveError: () => void;
}

export const AttendanceFileHandler: React.FC<AttendanceFileHandlerProps> = ({
  selectedDate,
  attendanceMembers,
  attendanceGuests,
  updateAttendance,
  onSaveSuccess,
  onSaveError
}) => {
  const generateAttendanceFile = (date: Date) => {
    const formattedDate = date.toLocaleDateString('pl-PL').replace(/\./g, '_');
    const presentMembers = attendanceMembers.filter(m => m.present);
    const presentGuests = attendanceGuests.filter(g => g.present);
    
    let content = `Lista obecności - ${date.toLocaleDateString('pl-PL')}\n\n`;
    content += `Obecni członkowie (${presentMembers.length} z ${attendanceMembers.length}):\n`;
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
    attendanceMembers.filter(m => !m.present).forEach((member, index) => {
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
    console.log('Current members state:', attendanceMembers);
    
    const presentMemberIds = attendanceMembers
      .filter(m => m.present)
      .map(m => m.id);

    const presentGuestIds = attendanceGuests
      .filter(g => g.present)
      .map(g => g.id);

    const newRecord = {
      date: normalizeDate(selectedDate),
      presentCount: attendanceMembers.filter(m => m.present).length,
      totalCount: attendanceMembers.length,
      presentMembers: presentMemberIds,
      presentGuests: presentGuestIds
    };

    try {
      await updateAttendance.mutateAsync(newRecord);
      generateAttendanceFile(selectedDate);
      onSaveSuccess(newRecord.presentCount, presentGuestIds.length);
    } catch (error) {
      console.error('Error saving attendance:', error);
      onSaveError();
    }
  };

  return (
    <Button 
      className="w-full" 
      onClick={handleSave}
      disabled={updateAttendance.isPending}
    >
      <Save className="w-4 h-4 mr-2" />
      {updateAttendance.isPending ? 'Zapisywanie...' : 'Zapisz obecność'}
    </Button>
  );
};
