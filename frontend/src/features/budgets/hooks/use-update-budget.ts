import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Budget } from '@/types/api';
import { type UpdateBudgetPayload, updateBudget } from '../api/budgets';
import { budgetKeys } from '../api/keys';

interface UpdateArgs {
  id: string;
  payload: UpdateBudgetPayload;
}

export function useUpdateBudgetMutation() {
  const queryClient = useQueryClient();
  return useMutation<Budget, Error, UpdateArgs>({
    mutationFn: ({ id, payload }) => updateBudget(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}
