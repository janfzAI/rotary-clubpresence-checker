
import { AlertCircle } from "lucide-react";
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

  return (
    <Alert className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Twoja rola: {roleTitle}</AlertTitle>
      <AlertDescription>{getRoleDescription()}</AlertDescription>
    </Alert>
  );
};
