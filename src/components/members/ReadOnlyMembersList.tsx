
import React from 'react';

interface Member {
  id: number;
  name: string;
  active?: boolean;
}

interface ReadOnlyMembersListProps {
  members: Member[];
}

export const ReadOnlyMembersList = ({ members }: ReadOnlyMembersListProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Lista członków</h2>
      <div className="space-y-3">
        {members.map((member, index) => (
          <div key={member.id} className={`p-4 border rounded-md ${member.active === false ? 'opacity-50' : ''}`}>
            <span>{index + 1}. {member.name}</span>
            {member.active === false && <span className="ml-2 text-sm text-red-500">(nieaktywny)</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
