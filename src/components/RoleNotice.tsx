
import { AlertCircle, ShieldAlert, ShieldCheck, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const RoleNotice = ({ isAdmin, isManager }: { 
  isAdmin: boolean;
  isManager?: boolean;
}) => {
  const roleTitle = isAdmin ? "Administrator" : isManager ? "Manager" : "Użytkownik";
  
  const getRoleDescription = () => {
    if (isAdmin) {
      return "Masz pełen dostęp do wszystkich funkcji systemu, w tym zarządzania członkami, gośćmi, obecnością i bazą danych.";
    }
    if (isManager) {
      return "Możesz zarządzać obecnością, gośćmi oraz przeglądać statystyki. Nie masz dostępu do zarządzania członkami i bazy danych.";
    }
    return "Masz dostęp tylko do przeglądania danych. Nie możesz wprowadzać żadnych zmian.";
  };

  const getIcon = () => {
    if (isAdmin) return <ShieldAlert className="h-5 w-5 text-red-500" />;
    if (isManager) return <ShieldCheck className="h-5 w-5 text-amber-500" />;
    return <User className="h-5 w-5 text-blue-500" />;
  };

  const getBgColor = () => {
    if (isAdmin) return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
    if (isManager) return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
    return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800";
  };

  return (
    <Alert className={`mb-6 ${getBgColor()} border-2 shadow-sm`}>
      <div className="flex items-start">
        <div className="mr-3 mt-1">{getIcon()}</div>
        <div>
          <AlertTitle className="text-lg font-bold mb-1">Twoja rola: {roleTitle}</AlertTitle>
          <AlertDescription className="text-sm">{getRoleDescription()}</AlertDescription>
        </div>
      </div>
    </Alert>
  );
};
