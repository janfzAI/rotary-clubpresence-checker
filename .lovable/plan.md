## Nowy rok rotariański 2026/2027

### Zakres

1. **`src/utils/dateUtils.ts`**
   - Rozszerzyć typ: `export type RotaryYear = '2024/2025' | '2025/2026' | '2026/2027'`
   - Dodać nowy przypadek `2026/2027` w `getRotaryYearConfig`:
     - `startDate: 2026-09-02` (środa, pierwsze spotkanie już się odbyło)
     - `endDate: 2027-06-30` (ostatnia środa czerwca)
     - `excludeDates: ['2026-12-24', '2026-12-25', '2026-12-31', '2027-01-01']` (Wigilia, Boże Narodzenie, Sylwester, Nowy Rok)
     - puste `specialDates`

2. **`src/components/YearNavigation.tsx`**
   - Zmienić etykietę zakładki 2025/2026 na "Rok 2025/2026" (przestaje być bieżącym)
   - Dodać nową zakładkę "Bieżący rok 2026/2027"

3. **Domyślny rok**
   - `src/pages/Index.tsx` linia 23: domyślny `selectedYear` zmienić z `'2025/2026'` na `'2026/2027'`
   - `src/hooks/useAttendanceState.ts` linia 58: domyślny parametr analogicznie

### Efekt

Po zmianach aplikacja otworzy się domyślnie na roku 2026/2027 z wygenerowaną listą śród od 2 września 2026 do 30 czerwca 2027 (z wykluczonymi świętami), a dane z lat 2024/2025 i 2025/2026 pozostaną dostępne w swoich zakładkach.
