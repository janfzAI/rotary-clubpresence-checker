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
