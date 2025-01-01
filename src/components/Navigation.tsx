import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, History, BarChart2, Users } from "lucide-react";

export const Navigation = ({ activeTab, onTabChange }: { 
  activeTab: string;
  onTabChange: (value: string) => void;
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full mb-6">
      <TabsList className="grid w-full grid-cols-4">
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
      </TabsList>
    </Tabs>
  );
};