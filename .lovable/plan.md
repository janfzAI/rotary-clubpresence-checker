# Plan: Zakładka „Podsumowanie spotkań"

## Cel

Nowa zakładka z pełną listą spotkań klubu: **data, temat spotkania, liczba obecnych** (członkowie + goście). Prezydent dostaje gotowe podsumowanie bez samych liczb.

## Zmiany

### 1. Baza danych (migracja — do zatwierdzenia)
- Do tabeli `attendance_records` dodana kolumna `topic` (tekst, opcjonalny) — temat danego spotkania.
- Uprawnienia bez zmian: odczyt dla wszystkich, zapis tematu dla zalogowanych z rolą admin/manager (istniejące polityki już to obejmują).

### 2. Nowa zakładka w nawigacji
- `src/components/Navigation.tsx` — nowa pozycja **„Podsumowanie spotkań"** (ikona kalendarza/listy), widoczna dla wszystkich zalogowanych.
- `src/pages/Index.tsx` — obsługa nowej zakładki `summary`, respektująca wybrany rok rotariański (2024/2025, 2025/2026, 2026/2027).

### 3. Nowy komponent `src/components/MeetingSummary.tsx`
- Tabela spotkań z wybranego roku rotariańskiego:
  - **Data** spotkania
  - **Temat** (z pola `topic`; gdy pusty — „—")
  - **Obecni członkowie** (liczba)
  - **Obecni goście** (liczba)
  - **Razem**
- Na górze proste podsumowanie roku: liczba spotkań, średnia frekwencja.
- Admin/manager może **edytować temat** bezpośrednio w wierszu (pole tekstowe z zapisem); pozostali widzą listę tylko do odczytu.
- Spotkania wyświetlane w kolejności chronologicznej.

### 4. Dane i stany
- Odczyt rekordów z `attendance_records` filtrowany datami danego roku (jak w pozostałych widokach).
- Spotkania bez wpisu obecności pokazane z liczbą 0 i opcją uzupełnienia tematu — lista oparta o pełny kalendarz śród z `dateUtils.ts`, a obecności dołączane po dacie.

## Szczegóły techniczne
- Migracja SQL: `ALTER TABLE public.attendance_records ADD COLUMN topic text;` (bez zmian RLS — obecne polityki wystarczają).
- Zapis tematu: `supabase.from('attendance_records').update({ topic })` lub insert, gdy rekord jeszcze nie istnieje (wówczas z datą i pustymi listami obecności).
- Lista spotkań generowana z `generateWednesdayDates(year)` i łączona z rekordami po dacie.
- Uprawnienia edycji tematu: `isAdmin || isManager` — tak jak przy zapisie obecności.

## Weryfikacja
- Test w podglądzie: zakładka widoczna, lista spotkań z liczbami, edycja tematu jako admin, odświeżenie strony — temat zapisany.
