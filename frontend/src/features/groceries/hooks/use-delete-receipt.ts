import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteReceipt } from '../api/groceries';
import { groceryKeys } from '../api/keys';

export function useDeleteReceiptMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteReceipt,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groceryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'budgets' }),
      ]);
    },
  });
}
