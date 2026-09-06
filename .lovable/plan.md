# Plan: Zakładka „Podsumowanie spotkań"

## Cel

Nowa zakładka z pełną listą spotkań klubu: **data, temat, prelegent, liczba obecnych członków oraz imiona i nazwiska obecnych gości**. Prezydent dostaje gotowe podsumowanie roku, a klub — informację, o czym było każde spotkanie.

## Zmiany

### 1. Baza danych (migracja — do zatwierdzenia)
- Do tabeli `attendance_records` dodane kolumny:
  - `topic` (tekst, opcjonalny) — temat spotkania,
  - `speaker_name` (tekst, opcjonalny) — imię i nazwisko prelegenta/występującego.
- Uprawnienia bez zmian: odczyt dla wszystkich, zapis dla zalogowanych (istniejące polityki już to obejmują).
- Nazwiska gości nie wymagają zmian w bazie — `present_guests` już przechowuje ID gości, a imiona i nazwiska pobierzemy z tabeli `guests`.

### 2. Nowa zakładka w nawigacji
- `src/components/Navigation.tsx` — nowa pozycja **„Podsumowanie spotkań"**, widoczna dla wszystkich zalogowanych.
- `src/pages/Index.tsx` — obsługa nowej zakładki `summary`, respektująca wybrany rok rotariański (2024/2025, 2025/2026, 2026/2027).

### 3. Nowy komponent `src/components/MeetingSummary.tsx`
Tabela/karta dla każdego spotkania z wybranego roku:
- **Data** spotkania
- **Temat** (gdy pusty — „—")
- **Prelegent** — imię i nazwisko (gdy pusty — „—")
- **Obecni członkowie** — liczba
- **Obecni goście** — liczba oraz lista imion i nazwisk (z tabeli `guests` po ID z `present_guests`)

Na górze podsumowanie roku: liczba odbytych spotkań i średnia frekwencja członków.

### 4. Edycja (admin/manager)
- Admin i manager mogą edytować **temat** i **prelegenta** bezpośrednio w wierszu spotkania (pola tekstowe z zapisem); pozostali widzą listę tylko do odczytu.
- Zapis: `update` istniejącego rekordu lub `insert` z samą datą i tematem, gdy rekordu jeszcze nie ma.

### 5. Dane i stany
- Lista spotkań generowana z `generateWednesdayDates(year)` (pełny kalendarz śród), a rekordy obecności dołączane po dacie — spotkania bez wpisu pokazane z liczbą 0.
- Goście rozwiązywani po ID; gość, którego już nie ma na liście, wyświetlany jako „(gość usunięty)".

## Szczegóły techniczne
- Migracja SQL: `ALTER TABLE public.attendance_records ADD COLUMN topic text, ADD COLUMN speaker_name text;`
- Uprawnienia edycji: `isAdmin || isManager` — tak jak przy zapisie obecności.
- Po migracji zregenerują się typy Supabase i kod będzie korzystał z nowych pól.

## Weryfikacja
- Test w podglądzie: zakładka widoczna, lista spotkań z liczbami i nazwiskami gości, edycja tematu i prelegenta jako admin, odświeżenie strony — dane zapisane.
