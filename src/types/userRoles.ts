
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export interface UserRole {
  id: string;
  email: string;
  role: AppRole;
}

export interface RoleChangeResult {
  email: string;
  passwordUpdated?: boolean;
  isNewUser?: boolean;
}
