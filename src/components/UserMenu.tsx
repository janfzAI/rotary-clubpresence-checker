
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const UserMenu = () => {
  const { toast } = useToast();
  const { userEmail, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Wylogowano pomyślnie",
        description: "Do zobaczenia!"
      });
    } catch (error) {
      toast({
        title: "Błąd wylogowania",
        description: error instanceof Error ? error.message : "Wystąpił nieznany błąd",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center gap-4">
      {userEmail && (
        <span className="text-sm text-gray-600">
          Zalogowany jako: {userEmail}
        </span>
      )}
      <Button variant="outline" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Wyloguj
      </Button>
    </div>
  );
};
