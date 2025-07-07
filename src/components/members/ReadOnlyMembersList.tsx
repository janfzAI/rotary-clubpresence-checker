
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
  const hasLeftInName = (name: string) => {
    return name.toLowerCase().includes('left');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Lista członków</h2>
      <div className="space-y-3">
        {members.map((member, index) => {
          const isInactive = member.active === false;
          const isLeft = hasLeftInName(member.name);
          return (
            <div key={member.id} className={`p-4 border rounded-md ${isInactive ? 'opacity-50 bg-gray-50 border-gray-200' : ''}`}>
              <span className={`${isInactive ? 'text-gray-500 line-through' : ''} ${isLeft ? 'text-yellow-600 font-medium' : ''}`}>
                {index + 1}. {member.name}
              </span>
              {isInactive && <span className="ml-2 text-sm text-red-600 font-medium no-underline">(nieaktywny)</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
