import { useQuery } from '@tanstack/react-query';
import type { Subcategory } from '@/types/api';
import { subcategoryKeys } from '../api/keys';
import { listSubcategories } from '../api/subcategories';

interface UseSubcategoriesQueryOptions {
  categoryId?: string;
  enabled?: boolean;
}

export function useSubcategoriesQuery(options: UseSubcategoriesQueryOptions = {}) {
  const enabled = options.enabled ?? true;
  return useQuery<Subcategory[]>({
    queryKey: options.categoryId
      ? subcategoryKeys.byCategory(options.categoryId)
      : subcategoryKeys.byUser(),
    queryFn: () => listSubcategories(options.categoryId ? { categoryId: options.categoryId } : {}),
    enabled,
  });
}
