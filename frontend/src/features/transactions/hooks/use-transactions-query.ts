import { useQuery } from '@tanstack/react-query';
import type { PaginatedTransactions } from '@/types/api';
import { type TransactionListFilters, transactionKeys } from '../api/keys';
import { listTransactions } from '../api/transactions';

export function useTransactionsQuery(filters: TransactionListFilters) {
  return useQuery<PaginatedTransactions>({
    queryKey: transactionKeys.list(filters),
    queryFn: () => listTransactions(filters),
  });
}
