import type { CurrencyCode, TransactionType } from '@/types/api';

export interface TransactionListFilters {
  type?: TransactionType;
  categoryId?: string;
  subcategoryId?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

export interface BalanceParams {
  startDate: string;
  endDate: string;
  currencyCode: CurrencyCode;
}

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters: TransactionListFilters) => [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
  balances: () => [...transactionKeys.all, 'balance'] as const,
  balance: (params: BalanceParams) => [...transactionKeys.balances(), params] as const,
};
