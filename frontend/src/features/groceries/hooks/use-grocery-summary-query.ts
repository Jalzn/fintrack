import { useQuery } from '@tanstack/react-query';
import type { GrocerySummary } from '@/types/api';
import { getGrocerySummary } from '../api/groceries';
import { type GrocerySummaryParams, groceryKeys } from '../api/keys';

export function useGrocerySummaryQuery(params: GrocerySummaryParams) {
  return useQuery<GrocerySummary>({
    queryKey: groceryKeys.summary(params),
    queryFn: () => getGrocerySummary(params),
  });
}
