# Plan: Wykres frekwencji na końcu raportu PDF

## Cel

Na stronie „Statystyki” w raporcie PDF, pod tabelą członków, pojawia się czytelny wykres frekwencji w czasie — taki sam układ danych jak na wykresie w aplikacji (procent obecnych na kolejnych spotkaniach).

## Jak będzie wyglądał

- Tytuł sekcji: „Frekwencja w czasie”.
- Wykres liniowy na całą szerokość strony, wysokość ok. 70 mm, na jasnym tle z delikatną siatką.
- Oś pionowa: 0–100% z podziałką co 25%.
- Oś pozioma: daty spotkań (skrócone, np. „3.09”), wyświetlane co drugą/co trzecią etykietę, gdy spotkań jest dużo — żeby się nie nakładały.
- Niebieska linia w kolorystyce raportu, z małymi punktami na każdym spotkaniu i delikatnym wypełnieniem pod linią.
- Przerywana linia średniej frekwencji z podpisem.
- Jeśli wykres nie mieści się pod tabelą, trafia na kolejną stronę z własnym tytułem i numeracją stron.
- Gdy w danym roku nie ma jeszcze odbytych spotkań, wykres jest pomijany.

## Zmiany techniczne

Wyłącznie `src/utils/meetingReportPdf.ts`: wykres rysowany natywnie w jsPDF (linie, prostokąty, tekst) na podstawie już liczonych `pastRecords` — bez nowych bibliotek, bez zrzutów ekranu i bez zmian w bazie danych.

## Weryfikacja

Wygenerowanie raportu dla roku z pełnym kompletem spotkań (2025/2026) oraz dla roku z jednym spotkaniem (2026/2027) i obejrzenie każdej strony: brak nakładających się etykiet, poprawne wartości, polskie znaki, wykres w granicach marginesów.
