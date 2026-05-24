/**
 * Period utilities. A "period" is a `YYYY-MM` string (e.g. `2026-05`).
 * Single source of truth for month math shared across dashboard, transactions and budgets.
 */

export interface DateRange {
  startDate: string;
  endDate: string;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

const MONTH_SHORT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

const PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidPeriod(value: string | null | undefined): value is string {
  return value != null && PERIOD_REGEX.test(value);
}

export function shiftPeriod(period: string, delta: number): string {
  const [yStr, mStr] = period.split('-');
  const date = new Date(Date.UTC(Number(yStr), Number(mStr) - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function previousPeriod(period: string): string {
  return shiftPeriod(period, -1);
}

export function nextPeriod(period: string): string {
  return shiftPeriod(period, 1);
}

/** Returns `n` periods ending at (and including) `period`, oldest first. */
export function lastNPeriods(period: string, n: number): string[] {
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    result.push(shiftPeriod(period, -i));
  }
  return result;
}

/** Local-time start/end of the month as ISO strings (matches the previous dashboard behavior). */
export function periodToRange(period: string): DateRange {
  const [yStr, mStr] = period.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

/** "Maio 2026" */
export function formatPeriod(period: string): string {
  const [yStr, mStr] = period.split('-');
  const monthName = MONTH_NAMES[Number(mStr) - 1] ?? '';
  return `${monthName} ${yStr}`;
}

/** "mai" */
export function formatPeriodShort(period: string): string {
  const [, mStr] = period.split('-');
  return MONTH_SHORT[Number(mStr) - 1] ?? '';
}
