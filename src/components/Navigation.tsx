
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, History, BarChart2, Users, User, Database } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";

export const Navigation = ({ activeTab, onTabChange, isAdmin }: { 
  activeTab: string;
  onTabChange: (value: string) => void;
  isAdmin: boolean;
}) => {
  return (
    <div className="w-full mb-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Rotary Club Szczecin</h1>
        <UserMenu />
      </div>
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full" style={{ 
          gridTemplateColumns: isAdmin ? "repeat(6, 1fr)" : "repeat(5, 1fr)" 
        }}>
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
          {isAdmin && (
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Baza danych</span>
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
    </div>
  );
};
