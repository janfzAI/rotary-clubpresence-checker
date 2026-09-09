# Plan: Statystyki na końcu raportu PDF

## Cel

Po tabeli spotkań raport PDF dostaje dodatkową sekcję „Statystyki” — te same liczby, które widać w zakładce Statystyki.

## Zawartość nowej sekcji

Zaczyna się od nowej strony, nagłówek „Statystyki — rok rotariański X/Y”.

1. Podsumowanie w jednym wierszu: liczba spotkań, średnia obecność (osób), średnia frekwencja (%).
2. Tabela obecności członków (tylko aktualni członkowie, osoby z „left” pominięte, tak jak na ekranie):
   - Lp.
   - Członek (nazwisko alfabetycznie)
   - Obecności (liczba)
   - Frekwencja (%)
   Sortowanie jak w aplikacji — po nazwisku.
3. Wiersz podsumowujący na dole tabeli (średnie).

Wykres z zakładki Statystyki pomijam — w druku jest mało czytelny, a te same dane są w tabeli. Jeśli chcesz wykres, dopiszę go jako obrazek.

## Zmiany w kodzie

1. `src/utils/meetingReportPdf.ts` — po `autoTable` ze spotkaniami dodać `doc.addPage()` i drugą tabelę ze statystykami; funkcja przyjmuje dodatkowo listę członków.
2. Obliczenia frekwencji przenieść do małej funkcji pomocniczej, żeby PDF i zakładka Statystyki liczyły identycznie (spotkania przeszłe, wykluczenie osób z „left”).
3. `src/components/MeetingSummary.tsx` — przekazanie listy członków do generatora.
4. `src/pages/Index.tsx` — przekazanie `members` do `MeetingSummary`.

Bez zmian w bazie danych.

## Weryfikacja

Wygenerowanie raportu w podglądzie dla roku 2025/2026 i sprawdzenie strona po stronie: polskie znaki, brak ucinania nazwisk, zgodność liczb z zakładką Statystyki.
