import { useMemo } from 'react';
import { useCategoriesQuery } from '@/features/categories/hooks/use-categories-query';
import { useTransactionsQuery } from '@/features/transactions/hooks/use-transactions-query';
import { CATEGORY_COLORS } from '@/lib/category-colors';
import { moneyToNumber } from '@/lib/money';
import { periodToRange } from '@/lib/period';
import type { MoneySnapshot } from '@/types/api';

const BRL = { code: 'BRL', base: 10, exponent: 2 };
const ZERO: MoneySnapshot = { amount: 0, currency: BRL };
const FALLBACK_PALETTE = CATEGORY_COLORS.map((c) => c.hex);

export interface CategorySpendRow {
  id: string;
  name: string;
  amount: MoneySnapshot;
  /** Amount in currency units (for charts/insights). */
  value: number;
  percent: number;
  hex: string;
}

export interface CategorySpend {
  rows: CategorySpendRow[];
  /** Total expense in currency units. */
  total: number;
  totalMoney: MoneySnapshot;
  isLoading: boolean;
}

/** Expenses grouped by category for a period. Shared by the donut and the insights. */
export function useCategorySpend(period: string): CategorySpend {
  const range = periodToRange(period);
  const { data: transactions, isLoading } = useTransactionsQuery({
    type: 'EXPENSE',
    startDate: range.startDate,
    endDate: range.endDate,
    page: 1,
    limit: 100,
  });
  const { data: categories } = useCategoriesQuery();

  return useMemo<CategorySpend>(() => {
    const txList = transactions?.data ?? [];
    if (txList.length === 0 || !categories) {
      return { rows: [], total: 0, totalMoney: ZERO, isLoading };
    }

    const totals = new Map<string, number>();
    for (const tx of txList) {
      totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount.amount);
    }
    const grandTotal = [...totals.values()].reduce((a, b) => a + b, 0);
    if (grandTotal === 0) {
      return { rows: [], total: 0, totalMoney: ZERO, isLoading };
    }

    const rows = [...totals.entries()]
      .map(([categoryId, amount], idx) => {
        const cat = categories.find((c) => c.id === categoryId);
        const fallback = FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length] ?? '#999999';
        const snapshot: MoneySnapshot = { amount, currency: BRL };
        return {
          id: categoryId,
          name: cat?.name ?? 'Sem categoria',
          amount: snapshot,
          value: moneyToNumber(snapshot),
          percent: Math.round((amount / grandTotal) * 100),
          hex: cat?.color ?? fallback,
        };
      })
      .sort((a, b) => b.amount.amount - a.amount.amount);

    const totalMoney: MoneySnapshot = { amount: grandTotal, currency: BRL };
    return { rows, total: moneyToNumber(totalMoney), totalMoney, isLoading };
  }, [transactions, categories, isLoading]);
}
