

## Analiza

Członkowie są zakodowani na stałe w `src/hooks/useAttendanceState.ts` (linie 16-53). Kluczowe wpisy:
- **ID 20**: `"Agata Łakomiak left"` → zastąpić przez `"Andrzej Wawrzyniak"` (aktywny)
- **ID 22**: `"Anna Lakomiak-Melka left"` → zastąpić przez `"Leszek Nagay"` (aktywny)

### Problem z historycznymi danymi

W bazie `attendance_records` istnieją rekordy, w których ID 20 i 22 są zapisane w `present_members`:
- **ID 20** (Agata): obecna 2024-12-18, 2025-06-25
- **ID 22** (Anna): obecna 2024-11-13, 2024-12-18

Po zmianie nazwy przy tych ID, historyczne statystyki obecności zostaną przypisane nowym osobom, co będzie **nieprawidłowe**. 

### Proponowane rozwiązanie

Zamiast nadpisywać istniejące ID, lepiej:
1. **Dodać nowych członków z nowymi ID** (37 i 38) — Andrzej Wawrzyniak i Leszek Nagay jako aktywni
2. **Oznaczyć starych członków jako nieaktywnych** — Agata Łakomiak (ID 20) i Anna Lakomiak-Melka (ID 22) zachowują swoje ID, ale `active: false`

Dzięki temu historyczne dane obecności pozostaną poprawne.

### Zmiany w pliku `src/hooks/useAttendanceState.ts`

- Linia 36: zmiana `{ id: 20, name: "Agata Łakomiak left", present: false, active: true }` → `active: false`
- Linia 38: zmiana `{ id: 22, name: "Anna Lakomiak-Melka left", present: false, active: true }` → `active: false`
- Po linii 52 (po Leszku Zdawskim): dodanie dwóch nowych wpisów:
  - `{ id: 37, name: "Andrzej Wawrzyniak", present: false, active: true }`
  - `{ id: 38, name: "Leszek Nagay", present: false, active: true }`

### Uwaga dot. literówki
W wiadomości napisano "Andrzewj" — zakładam, że poprawnie to **Andrzej Wawrzyniak**.

