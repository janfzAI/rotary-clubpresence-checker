# Plan: Uzupełnienie gości w „Podsumowaniu spotkań” na podstawie dat z nazwisk

## Cel

Lista gości zawiera daty (a czasem klub lub kontekst) dopisane do imienia i nazwiska, np. „Maciej Sumara RC Stargard 26.11.2025”. Te osoby nie są przypisane do żadnego spotkania — w zakładce „Podsumowanie spotkań” wszystkie spotkania pokazują 0 gości. Plan rozdziela te dane: czyste imię i nazwisko zostaje w kartotece gościa, a data decyduje, do którego spotkania gość zostaje przypisany.

## Co się zmieni w danych

1. **Oczyszczenie nazwisk** — z każdej pozycji listy gości usuwamy datę oraz dopiski typu „RC Stargard”, „Liceum Herberta”, „stypendium oszczep”, „tenis”, „Prezes ZCH Police”. Zostaje samo imię i nazwisko (np. „Maciej Sumara”). Wyjątek: wpis „Natalia i Tomasz Korczyńscy” zostaje bez zmian.
2. **Przypisanie do spotkań** — każdy gość trafia do spotkania o dacie z jego wpisu. Dotyczy obu lat: 2024/2025 i 2025/2026 (łącznie ok. 90 osób).
3. **Turniej tenisowy 22.11.2025** — traktowany jako specjalne spotkanie klubu: powstaje wpis dla tej daty z czterema gośćmi i tematem „Turniej tenisowy”, bez obecności członków.
4. **Spotkanie 4/5 lutego 2026** — w bazie obecność zapisana jest na 5 lutego (czwartek), a kalendarz klubu zna tylko środę 4 lutego, i taką datę ma wpis gościa. Rekord zostanie przesunięty na 4 lutego 2026, razem z gościem.
5. Kilka dat w kartotece gości nie pokrywa się ze środami z kalendarza (np. 13.11.2024, 16.11.2024, 21.02.2025, 25.09.2024) — te osoby zostaną przypisane do najbliższego spotkania klubu.

## Zmiany techniczne

- Migracja danych (`UPDATE` na `guests.name` oraz `attendance_records.present_guests`), przygotowana ze skryptu parsującego daty z nazw. Bez zmian w strukturze tabel i uprawnieniach.
- `src/utils/dateUtils.ts` — dodanie 22.11.2025 jako dodatkowej daty spotkania w roku 2025/2026 (poza regularnymi środami), aby turniej tenisowy był widoczny w podsumowaniu; data ta nie wchodzi do statystyk frekwencji członków.
- Bez zmian w komponentach — `MeetingSummary` i raport PDF same pokażą gości, gdy dane zostaną przypisane.

## Weryfikacja

Po migracji sprawdzenie w podglądzie: w zakładce „Podsumowanie spotkań” dla lat 2024/2025 i 2025/2026 przy odpowiednich datach pojawiają się nazwiska gości bez dat w nazwie, liczby gości zgadzają się z kartoteką, a raport PDF zawiera te same nazwiska.
