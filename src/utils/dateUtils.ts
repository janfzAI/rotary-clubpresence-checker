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
    '2025-01-01'  // Nowy Rok
  ];
  
  while (currentDate <= normalizedEndDate) {
    if (currentDate.getDay() === 3) { // Środa
      const dateStr = currentDate.toISOString().split('T')[0];
      if (!excludeDates.includes(dateStr)) {
        dates.push(new Date(currentDate));
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};