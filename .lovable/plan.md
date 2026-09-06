# Naprawa: obecność zapisana na złą datę (6 września zamiast 2 września 2026)

## Co się stało

Sprawdziłem bazę: dzisiaj powstał wpis z 17 obecnymi osobami, ale zapisany pod datą **6 września 2026** (dzisiejsza niedziela), a nie pod datą spotkania **2 września 2026** (środa).

Historia i statystyki pokazują wyłącznie środy z kalendarza roku rotariańskiego, więc wpis z niedzieli nigdzie się nie pojawia — stąd same zera.

Przyczyna: przy wejściu do aplikacji wybrana data ustawia się automatycznie na dzień dzisiejszy, nawet jeśli to nie jest dzień spotkania. Jeśli nie kliknie się daty w kalendarzu, zapis trafia na dzisiejszy dzień.

## Co zrobię

1. **Przeniosę istniejący wpis** z 6 września 2026 na 2 września 2026 (17 osób zostaje bez zmian). Zmiana w bazie — pokażę do zatwierdzenia.
2. **Poprawię domyślną datę**: po otwarciu aplikacja sama ustawi się na ostatnie spotkanie (środę) z wybranego roku rotariańskiego, które już się odbyło — zamiast na dzisiejszy dzień.
3. **Zabezpieczę zapis**: jeśli wybrana data nie jest dniem spotkania z kalendarza, aplikacja nie zapisze po cichu, tylko pokaże komunikat z prośbą o wybór daty spotkania.
4. Sprawdzę, że po zmianach spotkanie z 2 września widać w historii i w statystykach.

## Szczegóły techniczne

- Dane: `update attendance_records set date = '2026-09-02' where date = '2026-09-06'` (po sprawdzeniu, że wpis dla 2026-09-02 nie istnieje).
- `useAttendanceMembers`: inicjalizacja `selectedDate` z `generateWednesdayDates(rotaryYear)` — ostatnia data `<= dziś`, fallback pierwsza data roku; reakcja na zmianę roku rotariańskiego.
- `AttendanceFileHandler.handleSave`: walidacja, że `selectedDate` należy do listy dat wygenerowanych dla roku; w przeciwnym razie toast z ostrzeżeniem zamiast zapisu.
