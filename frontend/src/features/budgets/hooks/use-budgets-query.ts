import { useQuery } from '@tanstack/react-query';
import type { Budget } from '@/types/api';
import { listBudgets } from '../api/budgets';
import { budgetKeys } from '../api/keys';

export function useBudgetsQuery(period: string) {
  return useQuery<Budget[]>({
    queryKey: budgetKeys.list(period),
    queryFn: () => listBudgets(period),
  });
}
