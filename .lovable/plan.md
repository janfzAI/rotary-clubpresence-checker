

## Plan: Sortowanie po nazwisku + osoby "left" na końcu + wykluczenie ze statystyk

### Zmiany

#### 1. `src/lib/utils.ts` — dodać funkcję `sortByLastName`
Funkcja sortująca po nazwisku (ostatni człon, ignorując "left"), z osobami "left" zawsze na końcu:
```ts
export function sortByLastName(a: { name: string }, b: { name: string }) {
  const hasLeftA = /\s+left$/i.test(a.name);
  const hasLeftB = /\s+left$/i.test(b.name);
  if (hasLeftA !== hasLeftB) return hasLeftA ? 1 : -1;
  const getLastName = (name: string) => {
    const parts = name.replace(/\s+left$/i, '').trim().split(' ');
    return parts[parts.length - 1] || '';
  };
  return getLastName(a.name).localeCompare(getLastName(b.name), 'pl');
}
```

#### 2. `src/components/AttendanceList.tsx`
- Zmienić sortowanie: gdy `sortedAlphabetically=true`, używać `sortByLastName` zamiast `a.name.localeCompare(b.name)` — osoby "left" na końcu
- Przycisk sortowania zostaje bez zmian

#### 3. `src/components/GuestsManagement.tsx`
- Analogiczna zmiana sortowania gości (używać `sortByLastName`)

#### 4. `src/components/AttendanceStats.tsx`
- Odfiltrować osoby z "left" w nazwisku z `members` przed obliczaniem statystyk — nie wliczać ich do `memberStats`
- Posortować `memberStats` używając `sortByLastName`

#### 5. `src/hooks/useAttendanceState.ts`
- Oznaczyć Piotra Szajkowskiego (ID 32) jako `active: false` — ma "left" w nazwie ale wciąż `active: true`

