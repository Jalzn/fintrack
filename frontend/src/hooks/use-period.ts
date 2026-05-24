import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { currentPeriod, type DateRange, isValidPeriod, periodToRange } from '@/lib/period';

export interface UsePeriodResult {
  /** Current period as `YYYY-MM`. */
  period: string;
  setPeriod: (period: string) => void;
  /** Start/end ISO range for the current period. */
  range: DateRange;
}

/** Global period state, persisted in the URL (`?period=YYYY-MM`). */
export function usePeriod(): UsePeriodResult {
  const [params, setParams] = useSearchParams();
  const raw = params.get('period');
  const period = isValidPeriod(raw) ? raw : currentPeriod();

  const range = useMemo(() => periodToRange(period), [period]);

  const setPeriod = (next: string) => {
    const updated = new URLSearchParams(params);
    updated.set('period', next);
    setParams(updated, { replace: false });
  };

  return { period, setPeriod, range };
}
