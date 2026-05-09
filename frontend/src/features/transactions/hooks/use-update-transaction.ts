import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Transaction } from '@/types/api';
import { transactionKeys } from '../api/keys';
import { type UpdateTransactionPayload, updateTransaction } from '../api/transactions';

interface Variables {
  id: string;
  payload: UpdateTransactionPayload;
}

export function useUpdateTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation<Transaction, Error, Variables>({
    mutationFn: ({ id, payload }) => updateTransaction(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}
