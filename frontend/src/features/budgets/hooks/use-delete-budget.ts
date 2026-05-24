import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBudget } from '../api/budgets';
import { budgetKeys } from '../api/keys';

export function useDeleteBudgetMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteBudget,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}
