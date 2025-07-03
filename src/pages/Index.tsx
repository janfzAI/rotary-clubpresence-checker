
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
import { DatabaseStructure } from '@/components/DatabaseStructure';
import { ReadOnlyMembersList } from '@/components/members/ReadOnlyMembersList';
import { useAttendanceState } from '@/hooks/useAttendanceState';
import { ReadOnlyNotice } from '@/components/ReadOnlyNotice';
import { RoleNotice } from '@/components/RoleNotice';
import { useAuth } from '@/hooks/useAuth';
import { UserMenu } from '@/components/UserMenu';

const Index = () => {
  const { isAdmin, isManager, userEmail } = useAuth();
  
  const {
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
  } = useAttendanceState();

  // Define if user has permission to edit attendance and manage guests/members
  const canEditAttendance = isAdmin || isManager;
  const canManageGuests = isAdmin || isManager;
  const canManageMembers = isAdmin; // Only admins can manage members

  if (membersLoading) {
    return (
      <div className="container mx-auto p-4 w-[80%] lg:max-w-6xl xl:max-w-7xl">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Ładowanie danych...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 w-[80%] lg:max-w-6xl xl:max-w-7xl">
      <div className="flex justify-between items-center mb-4">
        <Navigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          isAdmin={isAdmin} 
          isManager={isManager} 
        />
        <UserMenu />
      </div>
      
      <RoleNotice isAdmin={isAdmin} isManager={isManager} />
      {!canEditAttendance && <ReadOnlyNotice />}
      
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
            onToggleAttendance={canEditAttendance ? toggleAttendance : () => {}}
            onToggleGuestAttendance={canEditAttendance ? toggleGuestAttendance : () => {}}
            readOnly={!canEditAttendance}
          />
          {canEditAttendance && (
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
          )}
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
        canManageMembers ? (
          <MembersManagement
            members={members}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onToggleActive={handleToggleActive}
          />
        ) : (
          <ReadOnlyMembersList members={members} />
        )
      )}

      {activeTab === 'guests' && (
        canManageGuests ? (
          <GuestsManagement
            guests={guests}
            onAddGuest={addGuest}
            onRemoveGuest={removeGuest}
          />
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Lista gości</h2>
            <div className="space-y-3">
              {guests.map((guest, index) => (
                <div key={guest.id} className="p-4 border rounded-md">
                  <span>{index + 1}. {guest.name}</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {activeTab === 'database' && isAdmin && (
        <DatabaseStructure />
      )}
    </div>
  );
};

export default Index;
