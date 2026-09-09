# Plan: Uzupełnienie gości w „Podsumowaniu spotkań” na podstawie dat z nazwisk

## Cel

Lista gości zawiera daty (a czasem klub lub kontekst) dopisane do imienia i nazwiska, np. „Maciej Sumara RC Stargard 26.11.2025”. Te osoby nie są przypisane do żadnego spotkania — w zakładce „Podsumowanie spotkań” wszystkie spotkania pokazują 0 gości. Plan rozdziela te dane: czyste imię i nazwisko zostaje w kartotece gościa, a data decyduje, do którego spotkania gość zostaje przypisany.

## Daty spoza środy (sprawdzone w bazie)

Tylko te wpisy nie wypadają w środę — pozostałe daty są poprawne:

| Data | Dzień | Osoby |
|---|---|---|
| 16.11.2024 | sobota | Romuald Oziewicz |
| 21.02.2025 | piątek | Lilian van der Velden |
| 21.03.2025 | piątek | Danuta Wróblewska, Grażyna Zdawska, Jolanta Kozłowska, Jeroen Simkens (RC Nijmegen), Eelke de Jong, Ronald de Groot, Jan Roelof Moll, Bart Kramer |
| 24.06.2025 | wtorek | Cezary Figurski |
| 22.11.2025 | sobota | Tomasz Banach, Jacek Berner, Andrzej Prędki, Andrzej Trejman (turniej tenisowy) |

Dodatkowo wpis „04.02.2026 Andrzej Wawrzyniak” wskazuje środę 4 lutego 2026, ale obecność w bazie zapisana jest na 5 lutego 2026 (czwartek).

Sposób obsługi:
- 22.11.2025 (tenis) i 21.03.2025 (wizyta RC Nijmegen, 8 osób) — traktowane jako specjalne spotkania klubu z własnym wpisem i tematem, bez obecności członków.
- 16.11.2024, 21.02.2025, 24.06.2025 — pojedyncze osoby, prawdopodobnie literówka w dacie: przypisane do najbliższego spotkania klubu (odpowiednio 13.11.2024, 19.02.2025, 25.06.2025).
- Rekord z 5 lutego 2026 przesunięty na środę 4 lutego 2026 razem z gościem.

## Co się zmieni w danych

1. **Oczyszczenie nazwisk** — z każdej pozycji listy gości usuwamy datę oraz dopiski typu „RC Stargard”, „Liceum Herberta”, „stypendium oszczep”, „tenis”, „Prezes ZCH Police”. Zostaje samo imię i nazwisko (np. „Maciej Sumara”). Wyjątek: „Natalia i Tomasz Korczyńscy” zostaje bez zmian.
2. **Przypisanie do spotkań** — każdy gość trafia do spotkania o dacie z jego wpisu. Dotyczy obu lat: 2024/2025 i 2025/2026 (łącznie ok. 90 osób).
3. Daty spoza środy obsłużone jak wyżej.

## Zmiany techniczne

- Migracja danych (`UPDATE` na `guests.name` oraz `attendance_records.present_guests`, `INSERT` dla dwóch spotkań specjalnych), przygotowana ze skryptu parsującego daty z nazw. Bez zmian w strukturze tabel i uprawnieniach.
- `src/utils/dateUtils.ts` — dodanie 21.03.2025 (rok 2024/2025) i 22.11.2025 (rok 2025/2026) jako dodatkowych dat spotkań poza regularnymi środami; nie wchodzą do statystyk frekwencji członków.
- Bez zmian w komponentach — „Podsumowanie spotkań” i raport PDF same pokażą gości, gdy dane zostaną przypisane.

## Weryfikacja

Po migracji sprawdzenie w podglądzie: w zakładce „Podsumowanie spotkań” dla obu lat przy odpowiednich datach pojawiają się nazwiska gości bez dat w nazwie, liczby gości zgadzają się z kartoteką, a raport PDF zawiera te same nazwiska.
