
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, History, BarChart2, Users, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

export const Navigation = ({ activeTab, onTabChange }: { 
  activeTab: string;
  onTabChange: (value: string) => void;
}) => {
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email);
      }
    };

    getCurrentUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email);
      } else {
        setUserEmail(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Błąd wylogowania",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Wylogowano pomyślnie",
        description: "Do zobaczenia!"
      });
    }
  };

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Rotary Club Szczecin</h1>
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
      </div>
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Obecność</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Historia</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span className="hidden sm:inline">Statystyki</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Członkowie</span>
          </TabsTrigger>
          <TabsTrigger value="guests" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Goście</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
