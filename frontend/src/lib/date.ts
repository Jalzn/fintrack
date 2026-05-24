import { format } from 'date-fns';

// Date-only API fields (purchaseDate, transaction date) travel as ISO instants
// anchored at UTC midnight. Reading them with `new Date(...)` and formatting in the
// browser timezone shifts the day back (UTC midnight seen from UTC-3 is the day before).
// These helpers read/write the value by its UTC calendar components instead.

export function parseDateOnly(iso: string): Date {
  const instant = new Date(iso);
  return new Date(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate());
}

export function formatDateOnly(
  iso: string,
  pattern: string,
  options?: Parameters<typeof format>[2],
): string {
  return format(parseDateOnly(iso), pattern, options);
}

export function dateToApiDateOnly(date: Date): string {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
}
