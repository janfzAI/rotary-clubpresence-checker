import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

// Normalizuje nazwę do porównań (bez znaków diakrytycznych, małe litery)
const normalizeName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

// Zwraca nazwiska gości bez osób wpisanych jako prelegenci danego spotkania
export function excludeSpeakersFromGuests(guestNames: string[], speakerName?: string | null) {
  if (!speakerName) return guestNames;
  const speakers = new Set(
    speakerName
      .split(/[,;]|\si\s/)
      .map(normalizeName)
      .filter(Boolean)
  );
  if (speakers.size === 0) return guestNames;
  return guestNames.filter(n => !speakers.has(normalizeName(n)));
}
