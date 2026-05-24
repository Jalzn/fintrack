import { useQueries } from '@tanstack/react-query';
import { transactionKeys } from '@/features/transactions/api/keys';
import { getBalance } from '@/features/transactions/api/transactions';
import { lastNPeriods, periodToRange } from '@/lib/period';
import type { MoneySnapshot } from '@/types/api';

const BRL = { code: 'BRL', base: 10, exponent: 2 };
const ZERO: MoneySnapshot = { amount: 0, currency: BRL };

export interface MonthlyPoint {
  period: string;
  income: MoneySnapshot;
  expense: MoneySnapshot;
  balance: MoneySnapshot;
}

/**
 * Monthly income/expense/balance for the last `months` periods (oldest first),
 * ending at `period`. Reuses the balance endpoint cache (same query key as
 * `useBalanceQuery`), so the current period is shared with the summary cards.
 */
export function useMonthlyTrendQuery(period: string, months = 6) {
  const periods = lastNPeriods(period, months);

  const results = useQueries({
    queries: periods.map((p) => {
      const range = periodToRange(p);
      const params = {
        startDate: range.startDate,
        endDate: range.endDate,
        currencyCode: 'BRL' as const,
      };
      return {
        queryKey: transactionKeys.balance(params),
        queryFn: () => getBalance(params),
      };
    }),
  });

  const isLoading = results.some((r) => r.isLoading);
  const points: MonthlyPoint[] = periods.map((p, i) => {
    const data = results[i]?.data;
    return {
      period: p,
      income: data?.income ?? ZERO,
      expense: data?.expense ?? ZERO,
      balance: data?.balance ?? ZERO,
    };
  });

  return { points, isLoading };
}
