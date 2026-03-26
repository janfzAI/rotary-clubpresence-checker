

## Problem

Tomasz Korczyński nie jest na liście członków klubu w pliku `src/hooks/useAttendanceState.ts`. Lista jest zakodowana na stałe i zawiera 38 członków — Tomasza Korczyńskiego wśród nich nie ma.

## Rozwiązanie

Dodać Tomasza Korczyńskiego jako nowego aktywnego członka z ID 39.

### Zmiana w pliku `src/hooks/useAttendanceState.ts`

Po linii 54 (Leszek Nagay, ID 38) dodać:

```
{ id: 39, name: "Tomasz Korczyński", present: false, active: true },
```

To jedyna wymagana zmiana — nowy członek pojawi się automatycznie na liście obecności.

