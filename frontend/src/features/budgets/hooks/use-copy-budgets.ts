import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Budget } from '@/types/api';
import { type CopyBudgetsPayload, copyBudgets } from '../api/budgets';
import { budgetKeys } from '../api/keys';

export function useCopyBudgetsMutation() {
  const queryClient = useQueryClient();
  return useMutation<Budget[], Error, CopyBudgetsPayload>({
    mutationFn: copyBudgets,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}
