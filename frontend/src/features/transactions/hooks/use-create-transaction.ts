import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Transaction } from '@/types/api';
import { transactionKeys } from '../api/keys';
import { type CreateTransactionPayload, createTransaction } from '../api/transactions';

export function useCreateTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation<Transaction, Error, CreateTransactionPayload>({
    mutationFn: createTransaction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}
