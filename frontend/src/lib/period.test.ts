import { describe, expect, it } from 'vitest';
import {
  formatPeriod,
  formatPeriodShort,
  isValidPeriod,
  lastNPeriods,
  nextPeriod,
  periodToRange,
  previousPeriod,
  shiftPeriod,
} from './period';

describe('period', () => {
  it('validates YYYY-MM', () => {
    expect(isValidPeriod('2026-05')).toBe(true);
    expect(isValidPeriod('2026-12')).toBe(true);
    expect(isValidPeriod('2026-13')).toBe(false);
    expect(isValidPeriod('2026-00')).toBe(false);
    expect(isValidPeriod('2026-5')).toBe(false);
    expect(isValidPeriod(null)).toBe(false);
    expect(isValidPeriod(undefined)).toBe(false);
  });

  it('shifts across year boundaries', () => {
    expect(shiftPeriod('2026-01', -1)).toBe('2025-12');
    expect(shiftPeriod('2026-12', 1)).toBe('2027-01');
    expect(previousPeriod('2026-05')).toBe('2026-04');
    expect(nextPeriod('2026-05')).toBe('2026-06');
  });

  it('returns the last N periods oldest-first ending at the given period', () => {
    expect(lastNPeriods('2026-03', 3)).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(lastNPeriods('2026-01', 2)).toEqual(['2025-12', '2026-01']);
  });

  it('converts a period to a local-month range', () => {
    const { startDate, endDate } = periodToRange('2026-05');
    const start = new Date(startDate);
    const end = new Date(endDate);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(4); // May (0-indexed)
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(4);
    expect(end.getDate()).toBe(31);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });

  it('formats labels in pt-BR', () => {
    expect(formatPeriod('2026-05')).toBe('Maio 2026');
    expect(formatPeriodShort('2026-05')).toBe('mai');
  });
});
