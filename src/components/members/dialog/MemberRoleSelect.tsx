
import React from 'react';
import { Label } from "@/components/ui/label";
import type { AppRole } from '@/types/userRoles';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MemberRoleSelectProps {
  selectedRole: AppRole;
  onRoleChange: (role: AppRole) => void;
}

export const MemberRoleSelect = ({
  selectedRole,
  onRoleChange
}: MemberRoleSelectProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="member-role">Rola</Label>
      <Select 
        value={selectedRole} 
        onValueChange={(value) => onRoleChange(value as AppRole)}
      >
        <SelectTrigger id="member-role">
          <SelectValue placeholder="Wybierz rolę" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Role</SelectLabel>
            <SelectItem value="admin">Administrator</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="user">Użytkownik</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
