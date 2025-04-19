
import { useState, useCallback } from 'react';
import { useUserRoles } from './useUserRoles';
import type { UserRole } from '@/types/userRoles';

export const useUserData = () => {
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState(0);
  const { users, fetchUsers } = useUserRoles();
  
  const refreshUserData = useCallback(async () => {
    console.log("Refreshing user data");
    try {
      await fetchUsers();
      setLastRefreshTimestamp(Date.now());
      return true;
    } catch (error) {
      console.error("Error refreshing user data:", error);
      return false;
    }
  }, [fetchUsers]);

  const getUserByEmail = (email: string): UserRole | undefined => {
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  };

  return {
    users,
    lastRefreshTimestamp,
    refreshUserData,
    getUserByEmail
  };
};
