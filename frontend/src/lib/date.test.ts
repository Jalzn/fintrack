import { describe, expect, it } from 'vitest';
import { dateToApiDateOnly, formatDateOnly, parseDateOnly } from './date';

describe('date-only helpers', () => {
  it('formats a UTC-midnight value as its calendar date, never the day before', () => {
    expect(formatDateOnly('2026-05-24T00:00:00.000Z', 'dd/MM/yyyy')).toBe('24/05/2026');
  });

  it('parseDateOnly keeps the UTC calendar day in local components', () => {
    const d = parseDateOnly('2026-05-24T00:00:00.000Z');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 4, 24]);
  });

  it('dateToApiDateOnly anchors a picked local date at UTC midnight', () => {
    expect(dateToApiDateOnly(new Date(2026, 4, 24))).toBe('2026-05-24T00:00:00.000Z');
  });

  it('round-trips a value without drifting the day', () => {
    const iso = '2026-05-24T00:00:00.000Z';
    expect(dateToApiDateOnly(parseDateOnly(iso))).toBe(iso);
  });
});
