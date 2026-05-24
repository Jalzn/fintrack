import { useQuery } from '@tanstack/react-query';
import type { PaginatedReceipts } from '@/types/api';
import { listReceipts } from '../api/groceries';
import { groceryKeys, type ReceiptListFilters } from '../api/keys';

export function useReceiptsQuery(filters: ReceiptListFilters) {
  return useQuery<PaginatedReceipts>({
    queryKey: groceryKeys.list(filters),
    queryFn: () => listReceipts(filters),
  });
}
