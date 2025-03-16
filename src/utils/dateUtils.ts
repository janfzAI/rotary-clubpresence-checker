
export const normalizeDate = (date: Date) => {
  // Ustaw datę na północ w lokalnej strefie czasowej
  const normalized = new Date(date);
  normalized.setHours(12, 0, 0, 0); // Ustawiamy na 12:00 żeby uniknąć problemów ze strefami czasowymi
  return normalized;
};

export const areDatesEqual = (date1: Date, date2: Date) => {
  const d1 = normalizeDate(date1);
  const d2 = normalizeDate(date2);
  return d1.getTime() === d2.getTime();
};

export const generateWednesdayDates = (startDate: Date, endDate: Date) => {
  const dates = [];
  const currentDate = normalizeDate(new Date(startDate));
  const normalizedEndDate = normalizeDate(endDate);
  
  // Lista dat do wykluczenia
  const excludeDates = [
    '2024-12-25', // Boże Narodzenie
    '2025-01-01', // Nowy Rok
    '2025-02-26', // Dodano datę 26 lutego do wykluczenia
    '2025-03-19'  // Wykluczono spotkanie ze środy 19 marca
  ];
  
  // Lista specjalnych dat (niestandardowych spotkań)
  const specialDates = [
    '2025-03-21'  // Dodano specjalne spotkanie w piątek 21 marca zamiast środy
  ];
  
  // Najpierw dodajemy wszystkie środy
  while (currentDate <= normalizedEndDate) {
    if (currentDate.getDay() === 3) { // Środa
      const dateStr = currentDate.toISOString().split('T')[0];
      if (!excludeDates.includes(dateStr)) {
        dates.push(new Date(currentDate));
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Następnie dodajemy specjalne daty
  for (const specialDateStr of specialDates) {
    const specialDate = new Date(specialDateStr);
    specialDate.setHours(12, 0, 0, 0);
    dates.push(specialDate);
  }
  
  // Sortujemy daty chronologicznie
  dates.sort((a, b) => a.getTime() - b.getTime());
  
  return dates;
};
