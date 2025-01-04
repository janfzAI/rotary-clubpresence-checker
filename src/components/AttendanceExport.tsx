import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface AttendanceRecord {
  date: Date;
  presentCount: number;
  totalCount: number;
}

interface AttendanceExportProps {
  history: AttendanceRecord[];
}

export const AttendanceExport: React.FC<AttendanceExportProps> = ({ history }) => {
  const { toast } = useToast();

  const exportToCSV = () => {
    const headers = ['Data', 'Obecni', 'Wszyscy'];
    const csvContent = [
      headers.join(','),
      ...history.map(record => 
        [
          record.date.toLocaleDateString('pl-PL'),
          record.presentCount,
          record.totalCount
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'obecnosc.csv';
    link.click();
    
    toast({
      title: "Wyeksportowano dane",
      description: "Plik CSV został pobrany.",
    });
  };

  return (
    <Button className="w-full" onClick={exportToCSV}>
      <Download className="w-4 h-4 mr-2" />
      Eksportuj do CSV
    </Button>
  );
};