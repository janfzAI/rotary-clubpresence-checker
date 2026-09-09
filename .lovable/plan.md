# Plan: Raport PDF w zakładce „Podsumowanie spotkań”

## Cel

Przycisk **„Pobierz raport PDF”** na górze zakładki Podsumowanie, generujący gotowy do druku dokument z listą spotkań wybranego roku rotariańskiego: data, temat, prelegent, liczba obecnych członków oraz imiona i nazwiska obecnych gości.

## Zawartość raportu

- Nagłówek: „Rotary Club Szczecin — Podsumowanie spotkań”, rok rotariański, data wygenerowania.
- Podsumowanie: liczba odbytych spotkań, średnia frekwencja członków.
- Tabela spotkań (tylko te, które się odbyły), kolumny:
  - Data
  - Temat (pusty → „—”)
  - Prelegent (pusty → „—”)
  - Obecni członkowie (liczba)
  - Goście (liczba + nazwiska pod spodem)
- Numeracja stron, format A4 pionowo, polskie znaki.

## Zmiany w kodzie

1. Nowa zależność: `jspdf` + `jspdf-autotable` (generowanie po stronie przeglądarki, bez serwera) z osadzoną czcionką obsługującą polskie znaki (Roboto/DejaVu) — inaczej „ą, ś, ż” wypadną z dokumentu.
2. Nowy plik `src/utils/meetingReportPdf.ts` — funkcja budująca dokument z tych samych danych, które już widać na ekranie (`records`, `guests`), zwracająca plik `podsumowanie-spotkan-<rok>.pdf`.
3. `src/components/MeetingSummary.tsx` — przycisk „Pobierz raport PDF” obok kart podsumowania; komponent dostaje dodatkowo `rotaryYear` do tytułu i nazwy pliku.
4. `src/pages/Index.tsx` — przekazanie `selectedYear` do `MeetingSummary`.

Bez zmian w bazie danych i bez zmian uprawnień — raport widzi każdy zalogowany, tak jak samą zakładkę.

## Weryfikacja

Wygenerowanie raportu w podglądzie i sprawdzenie strona po stronie: polskie znaki, brak ucinania tekstu w kolumnie tematu, poprawne liczby i nazwiska gości.
