import { useQuery } from '@tanstack/react-query';
import type { GroceryReceipt } from '@/types/api';
import { getReceiptById } from '../api/groceries';
import { groceryKeys } from '../api/keys';

export function useReceiptQuery(id: string | null) {
  return useQuery<GroceryReceipt>({
    queryKey: groceryKeys.detail(id ?? ''),
    queryFn: () => getReceiptById(id ?? ''),
    enabled: id !== null,
  });
}
