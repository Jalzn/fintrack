import { useQuery } from '@tanstack/react-query';
import type { Balance } from '@/types/api';
import { type BalanceParams, transactionKeys } from '../api/keys';
import { getBalance } from '../api/transactions';

export function useBalanceQuery(params: BalanceParams) {
  return useQuery<Balance>({
    queryKey: transactionKeys.balance(params),
    queryFn: () => getBalance(params),
  });
}
