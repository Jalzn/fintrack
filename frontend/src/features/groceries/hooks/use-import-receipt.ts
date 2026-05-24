import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GroceryReceipt } from '@/types/api';
import { type ImportReceiptPayload, importReceipt } from '../api/groceries';
import { groceryKeys } from '../api/keys';

export function useImportReceiptMutation() {
  const queryClient = useQueryClient();
  return useMutation<GroceryReceipt, Error, ImportReceiptPayload>({
    mutationFn: importReceipt,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groceryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'budgets' }),
      ]);
    },
  });
}
