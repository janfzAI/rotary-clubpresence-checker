import { useState } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, User, Mic, Save, FileDown } from 'lucide-react';
import { AttendanceRecord } from '@/hooks/useAttendanceData';
import { sortByLastName } from '@/lib/utils';
import { generateMeetingReportPdf } from '@/utils/meetingReportPdf';
import { useToast } from '@/components/ui/use-toast';

interface Guest {
  id: number;
  name: string;
}

interface MeetingSummaryProps {
  records: AttendanceRecord[];
  guests: Guest[];
  canEdit: boolean;
  rotaryYear: string;
  onSaveDetails: (date: Date, topic: string | null, speakerName: string | null) => void;
}

const EditableField = ({
  value,
  placeholder,
  canEdit,
  onSave
}: {
  value: string;
  placeholder: string;
  canEdit: boolean;
  onSave: (value: string) => void;
}) => {
  const [text, setText] = useState(value);
  const [dirty, setDirty] = useState(false);

  if (!canEdit) {
    return <span className={text ? '' : 'text-muted-foreground'}>{text || '—'}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={text}
        placeholder={placeholder}
        className="h-8"
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
        }}
      />
      {dirty && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          onClick={() => {
            onSave(text.trim());
            setDirty(false);
          }}
        >
          <Save className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export const MeetingSummary = ({ records, guests, canEdit, rotaryYear, onSaveDetails }: MeetingSummaryProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const guestNameById = new Map(guests.map(g => [g.id, g.name]));

  const resolveGuestNames = (ids?: number[]) =>
    (ids || [])
      .map(id => ({ name: guestNameById.get(id) || '(gość usunięty)' }))
      .sort(sortByLastName)
      .map(g => g.name);

  const heldMeetings = records.filter(r => (r.presentMembers?.length || 0) > 0);
  const avgAttendance = heldMeetings.length > 0
    ? Math.round((heldMeetings.reduce((sum, r) => sum + (r.presentMembers?.length || 0), 0) / heldMeetings.length) * 10) / 10
    : 0;

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      await generateMeetingReportPdf(records, guests, rotaryYear);
      toast({
        title: 'Raport gotowy',
        description: 'Plik PDF z podsumowaniem spotkań został pobrany.'
      });
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast({
        title: 'Błąd generowania raportu',
        description: 'Nie udało się przygotować pliku PDF. Spróbuj ponownie.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleDownloadPdf} disabled={isGenerating}>
          <FileDown className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generowanie…' : 'Pobierz raport PDF'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <Card className="flex-1 min-w-[200px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Odbyte spotkania</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{heldMeetings.length}</div>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[200px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Średnia frekwencja członków</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAttendance}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {records.map((record) => {
          const guestNames = resolveGuestNames(record.presentGuests);
          const membersCount = record.presentMembers?.length || 0;
          const hasAttendance = membersCount > 0;

          return (
            <Card key={record.date.toISOString()} className={hasAttendance ? '' : 'opacity-60'}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      {format(record.date, 'd MMMM yyyy', { locale: pl })}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Członkowie: {membersCount}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Goście: {guestNames.length}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Temat spotkania</div>
                      <EditableField
                        key={`topic-${record.date.toISOString()}-${record.topic ?? ''}`}
                        value={record.topic || ''}
                        placeholder="Wpisz temat spotkania"
                        canEdit={canEdit}
                        onSave={(v) => onSaveDetails(record.date, v || null, record.speakerName ?? null)}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Mic className="h-3 w-3" /> Prelegent
                      </div>
                      <EditableField
                        key={`speaker-${record.date.toISOString()}-${record.speakerName ?? ''}`}
                        value={record.speakerName || ''}
                        placeholder="Imię i nazwisko prelegenta"
                        canEdit={canEdit}
                        onSave={(v) => onSaveDetails(record.date, record.topic ?? null, v || null)}
                      />
                    </div>
                  </div>

                  {guestNames.length > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Obecni goście</div>
                      <div className="text-sm">{guestNames.join(', ')}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
