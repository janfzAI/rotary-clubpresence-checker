
import React from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, UserCog, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AppRole } from '@/types/userRoles';

interface MemberListItemProps {
  member: {
    id: number;
    name: string;
    active?: boolean;
  };
  index: number;
  isAdmin: boolean;
  userRole?: AppRole;
  onToggleActive: (id: number, name: string, isCurrentlyActive: boolean) => void;
  onOpenRoleDialog: (member: { id: number; name: string; active?: boolean }) => void;
  onRemoveMember: (id: number, name: string) => void;
  onOpenEmailEdit?: (member: { id: number; name: string }) => void;
}

export const MemberListItem = ({
  member,
  index,
  isAdmin,
  userRole,
  onToggleActive,
  onOpenRoleDialog,
  onRemoveMember,
  onOpenEmailEdit
}: MemberListItemProps) => {
  const getRoleLabel = (role?: AppRole) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'manager':
        return 'Manager';
      default:
        return 'Użytkownik';
    }
  };

  return (
    <div key={member.id} className="p-4 flex justify-between items-center border rounded-md">
      <span className="flex items-center gap-2 flex-1">
        <span className="text-sm text-muted-foreground">{index + 1}.</span>
        <span className="flex items-center gap-2">
          {member.name}
          {userRole && (
            <Badge variant={userRole}>
              {getRoleLabel(userRole)}
            </Badge>
          )}
        </span>
        {member.active === false && (
          <span className="text-sm text-red-500 font-medium ml-2">(nieaktywny)</span>
        )}
      </span>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor={`active-${member.id}`}>Aktywny</Label>
          <Switch
            id={`active-${member.id}`}
            checked={member.active !== false}
            onCheckedChange={() => onToggleActive(member.id, member.name, member.active !== false)}
          />
        </div>

        {isAdmin && (
          <>
            {onOpenEmailEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onOpenEmailEdit(member)}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onOpenRoleDialog(member)}
            >
              <UserCog className="w-4 h-4 mr-2" />
              Uprawnienia
            </Button>
          </>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => onRemoveMember(member.id, member.name)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Całkowicie usuń z systemu</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

