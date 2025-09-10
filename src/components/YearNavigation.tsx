import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "lucide-react";
import { RotaryYear } from "@/utils/dateUtils";

interface YearNavigationProps {
  activeYear: RotaryYear;
  onYearChange: (year: RotaryYear) => void;
}

export const YearNavigation = ({ activeYear, onYearChange }: YearNavigationProps) => {
  return (
    <div className="w-full mb-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Rotary Club Szczecin</h1>
        <Tabs value={activeYear} onValueChange={onYearChange}>
          <TabsList>
            <TabsTrigger value="2024/2025" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Rok 2024/2025
            </TabsTrigger>
            <TabsTrigger value="2025/2026" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Bieżący rok 2025/2026
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};