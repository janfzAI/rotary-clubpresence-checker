
import React from 'react';
import { AttendanceList } from '@/components/AttendanceList';
import { AttendanceHeader } from '@/components/AttendanceHeader';
import { Navigation } from '@/components/Navigation';
import { MembersManagement } from '@/components/MembersManagement';
import { GuestsManagement } from '@/components/GuestsManagement';
import { AttendanceHistory } from '@/components/AttendanceHistory';
import { AttendanceStats } from '@/components/AttendanceStats';
import { AttendanceExport } from '@/components/AttendanceExport';
import { AttendanceFileHandler } from '@/components/AttendanceFileHandler';
import { useAttendanceState } from '@/hooks/useAttendanceState';

const Index = () => {
  const {
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
  } = useAttendanceState();

  return (
    <div className="container mx-auto p-4 w-[80%] lg:max-w-6xl xl:max-w-7xl">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <AttendanceHeader
            date={selectedDate}
            presentCount={attendanceMembers.filter(m => m.present).length}
            totalCount={attendanceMembers.length}
            presentGuestsCount={attendanceGuests.filter(g => g.present).length}
          />
          <AttendanceList
            members={attendanceMembers}
            guests={attendanceGuests}
            onToggleAttendance={toggleAttendance}
            onToggleGuestAttendance={toggleGuestAttendance}
          />
          <AttendanceFileHandler
            selectedDate={selectedDate}
            attendanceMembers={attendanceMembers}
            attendanceGuests={attendanceGuests}
            updateAttendance={updateAttendance}
            onSaveSuccess={(presentCount, presentGuestsCount) => {
              toast({
                title: "Zapisano obecność",
                description: `Zaktualizowano listę obecności dla ${presentCount} członków i ${presentGuestsCount} gości.`,
              });
            }}
            onSaveError={() => {
              toast({
                title: "Błąd zapisu",
                description: "Nie udało się zapisać obecności. Spróbuj ponownie.",
                variant: "destructive"
              });
            }}
          />
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
