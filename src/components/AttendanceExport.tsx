import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface AttendanceRecord {
  date: Date;
  presentCount: number;
  totalCount: number;
  presentMembers?: number[];
}

interface Member {
  id: number;
  name: string;
}

interface AttendanceExportProps {
  history: AttendanceRecord[];
  members: Member[];
}

export const AttendanceExport: React.FC<AttendanceExportProps> = ({ history, members }) => {
  const { toast } = useToast();

  const exportToCSV = () => {
    console.log('Generating attendance matrix...');
    
    // Sort history by date
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Create header row
    let csvContent = "LP,Imię i Nazwisko";
    sortedHistory.forEach(record => {
      csvContent += `,${new Date(record.date).toLocaleDateString('pl-PL')}`;
    });
    csvContent += ",Liczba obecności,Procent obecności\n";

    // Calculate attendance for each member
    members.forEach((member, index) => {
      const memberAttendance = sortedHistory.map(record => 
        record.presentMembers?.includes(member.id) ? "1" : "0"
      );
      
      const presentCount = memberAttendance.filter(a => a === "1").length;
      const attendancePercentage = (presentCount / sortedHistory.length * 100).toFixed(1);

      csvContent += `${index + 1},${member.name}`;
      memberAttendance.forEach(attendance => {
        csvContent += `,${attendance}`;
      });
      csvContent += `,${presentCount},${attendancePercentage}%\n`;
    });

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `obecnosc_matrix_${new Date().toLocaleDateString('pl-PL').replace(/\./g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Wyeksportowano dane",
      description: "Plik CSV z macierzą obecności został pobrany.",
    });
  };

  return (
    <Button className="w-full" onClick={exportToCSV}>
      <Download className="w-4 h-4 mr-2" />
      Eksportuj do CSV
    </Button>
  );
};