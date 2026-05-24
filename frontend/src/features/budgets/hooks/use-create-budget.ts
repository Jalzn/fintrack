import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Budget } from '@/types/api';
import { type CreateBudgetPayload, createBudget } from '../api/budgets';
import { budgetKeys } from '../api/keys';

export function useCreateBudgetMutation() {
  const queryClient = useQueryClient();
  return useMutation<Budget, Error, CreateBudgetPayload>({
    mutationFn: createBudget,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}
