import { useMemo } from 'react';
import { subtractMoney, sumMoney } from '@/lib/money';
import type { MoneySnapshot } from '@/types/api';
import type { TransactionListFilters } from '../api/keys';
import { useTransactionsQuery } from './use-transactions-query';

const BRL = { code: 'BRL', base: 10, exponent: 2 };

const SUMMARY_LIMIT = 100;

export interface TransactionsSummaryResult {
  income: MoneySnapshot;
  expense: MoneySnapshot;
  balance: MoneySnapshot;
  count: number;
  /** True when more transactions match than the summary could sum (capped at 100). */
  partial: boolean;
  isLoading: boolean;
}

/** Income/expense/balance totals for the currently filtered transaction set. */
export function useTransactionsSummary(
  filters: Omit<TransactionListFilters, 'page' | 'limit'>,
): TransactionsSummaryResult {
  const { data, isLoading } = useTransactionsQuery({ ...filters, page: 1, limit: SUMMARY_LIMIT });

  return useMemo(() => {
    const list = data?.data ?? [];
    const income = sumMoney(
      list.filter((t) => t.type === 'INCOME').map((t) => t.amount),
      BRL,
    );
    const expense = sumMoney(
      list.filter((t) => t.type === 'EXPENSE').map((t) => t.amount),
      BRL,
    );
    const total = data?.total ?? 0;
    return {
      income,
      expense,
      balance: subtractMoney(income, expense),
      count: total,
      partial: total > list.length,
      isLoading,
    };
  }, [data, isLoading]);
}
