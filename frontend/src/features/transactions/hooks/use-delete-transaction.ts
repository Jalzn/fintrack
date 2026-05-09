import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionKeys } from '../api/keys';
import { deleteTransaction } from '../api/transactions';

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteTransaction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}
