import { useQuery } from '@tanstack/react-query';
import type { Category, TransactionType } from '@/types/api';
import { listCategories } from '../api/categories';
import { categoryKeys } from '../api/keys';

interface UseCategoriesQueryOptions {
  type?: TransactionType;
  enabled?: boolean;
}

export function useCategoriesQuery(options: UseCategoriesQueryOptions = {}) {
  const filters = options.type !== undefined ? { type: options.type } : {};
  return useQuery<Category[]>({
    queryKey: categoryKeys.list(filters),
    queryFn: () => listCategories(filters),
    enabled: options.enabled ?? true,
  });
}
