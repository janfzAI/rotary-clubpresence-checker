import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { AttendanceRecord } from '@/hooks/useAttendanceData';
import { sortByLastName } from '@/lib/utils';

interface Guest {
  id: number;
  name: string;
}

const FONT_REGULAR = '/fonts/DejaVuSans-subset.ttf';
const FONT_BOLD = '/fonts/DejaVuSans-Bold-subset.ttf';

const fetchFontBase64 = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Nie udało się pobrać czcionki: ${url}`);
  const buffer = await res.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

export const generateMeetingReportPdf = async (
  records: AttendanceRecord[],
  guests: Guest[],
  rotaryYear: string
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const [regular, bold] = await Promise.all([
    fetchFontBase64(FONT_REGULAR),
    fetchFontBase64(FONT_BOLD)
  ]);
  doc.addFileToVFS('DejaVuSans.ttf', regular);
  doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
  doc.addFileToVFS('DejaVuSans-Bold.ttf', bold);
  doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold');
  doc.setFont('DejaVuSans', 'normal');

  const guestNameById = new Map(guests.map(g => [g.id, g.name]));
  const resolveGuestNames = (ids?: number[]) =>
    (ids || [])
      .map(id => ({ name: guestNameById.get(id) || '(gość usunięty)' }))
      .sort(sortByLastName)
      .map(g => g.name);

  const held = records.filter(r => (r.presentMembers?.length || 0) > 0);
  const avg = held.length
    ? Math.round((held.reduce((s, r) => s + (r.presentMembers?.length || 0), 0) / held.length) * 10) / 10
    : 0;

  const marginX = 14;

  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(16);
  doc.text('Rotary Club Szczecin — Podsumowanie spotkań', marginX, 18);

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(11);
  doc.text(`Rok rotariański ${rotaryYear}`, marginX, 25);
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(
    `Wygenerowano: ${format(new Date(), 'd MMMM yyyy, HH:mm', { locale: pl })}`,
    marginX,
    31
  );
  doc.text(
    `Odbyte spotkania: ${held.length}    Średnia frekwencja członków: ${avg}`,
    marginX,
    36
  );
  doc.setTextColor(0);

  const body = held.map(r => {
    const guestNames = resolveGuestNames(r.presentGuests);
    return [
      format(r.date, 'dd.MM.yyyy', { locale: pl }),
      r.topic?.trim() || '—',
      r.speakerName?.trim() || '—',
      String(r.presentMembers?.length || 0),
      guestNames.length ? `${guestNames.length}\n${guestNames.join(', ')}` : '0'
    ];
  });

  autoTable(doc, {
    startY: 42,
    head: [['Data', 'Temat', 'Prelegent', 'Obecni\nczłonkowie', 'Goście']],
    body: body.length ? body : [['—', 'Brak odbytych spotkań w tym roku', '—', '—', '—']],
    margin: { left: marginX, right: marginX, bottom: 18 },
    styles: {
      font: 'DejaVuSans',
      fontSize: 8.5,
      cellPadding: 2,
      overflow: 'linebreak',
      valign: 'top',
      lineColor: [220, 220, 220],
      lineWidth: 0.1
    },
    headStyles: {
      font: 'DejaVuSans',
      fontStyle: 'bold',
      fillColor: [23, 69, 143],
      textColor: 255,
      fontSize: 8.5,
      halign: 'left'
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 21 },
      1: { cellWidth: 55 },
      2: { cellWidth: 36 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 50 }
    },
    didDrawPage: () => {
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.getHeight();
      const pageWidth = pageSize.getWidth();
      doc.setFont('DejaVuSans', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(130);
      const page = doc.getCurrentPageInfo().pageNumber;
      doc.text(`Strona ${page}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
      doc.setTextColor(0);
    }
  });

  doc.save(`podsumowanie-spotkan-${rotaryYear.replace('/', '-')}.pdf`);
};
