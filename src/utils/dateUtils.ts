
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

export type RotaryYear = '2024/2025' | '2025/2026';

export const getRotaryYearConfig = (year: RotaryYear) => {
  switch (year) {
    case '2024/2025':
      return {
        startDate: new Date('2024-09-04'),
        endDate: new Date('2025-06-25'),
        excludeDates: [
          '2024-10-23', // 23 października 2024
          '2024-10-30', // 30 października 2024
          '2024-12-25', // Boże Narodzenie
          '2025-01-01', // Nowy Rok
          '2025-02-26', // Dodano datę 26 lutego do wykluczenia
          '2025-03-19', // Wykluczono spotkanie ze środy 19 marca
          '2025-04-23', // 23 kwietnia 2025
          '2025-05-21'  // 21 maja 2025
        ],
        specialDates: [
          '2025-03-21'  // Dodano specjalne spotkanie w piątek 21 marca zamiast środy
        ]
      };
    case '2025/2026':
      return {
        startDate: new Date('2025-09-03'),
        endDate: new Date('2026-06-24'),
        excludeDates: [
          // Dodaj daty do wykluczenia dla nowego roku rotarskiego
          '2025-12-25', // Boże Narodzenie
          '2026-01-01', // Nowy Rok
        ],
        specialDates: [
          // Dodaj specjalne daty dla nowego roku rotarskiego
        ]
      };
  }
};

export const generateWednesdayDates = (year: RotaryYear) => {
  const config = getRotaryYearConfig(year);
  const dates = [];
  const currentDate = normalizeDate(new Date(config.startDate));
  const normalizedEndDate = normalizeDate(config.endDate);
  
  // Najpierw dodajemy wszystkie środy
  while (currentDate <= normalizedEndDate) {
    if (currentDate.getDay() === 3) { // Środa
      const dateStr = currentDate.toISOString().split('T')[0];
      if (!config.excludeDates.includes(dateStr)) {
        dates.push(new Date(currentDate));
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Następnie dodajemy specjalne daty
  for (const specialDateStr of config.specialDates) {
    const specialDate = new Date(specialDateStr);
    specialDate.setHours(12, 0, 0, 0);
    dates.push(specialDate);
  }
  
  // Sortujemy daty chronologicznie
  dates.sort((a, b) => a.getTime() - b.getTime());
  
  return dates;
};
