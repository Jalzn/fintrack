import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GroceryReceipt } from '@/types/api';
import { type UpdateReceiptPayload, updateReceipt } from '../api/groceries';
import { groceryKeys } from '../api/keys';

interface UpdateReceiptVariables {
  id: string;
  payload: UpdateReceiptPayload;
}

export function useUpdateReceiptMutation() {
  const queryClient = useQueryClient();
  return useMutation<GroceryReceipt, Error, UpdateReceiptVariables>({
    mutationFn: ({ id, payload }) => updateReceipt(id, payload),
    onSuccess: async () => {
      // Editing a receipt also syncs the linked transaction (date + amount), which budgets read.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groceryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'budgets' }),
      ]);
    },
  });
}
