import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Subcategory } from '@/types/api';
import { subcategoryKeys } from '../api/keys';
import { type CreateSubcategoryPayload, createSubcategory } from '../api/subcategories';

export function useCreateSubcategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation<Subcategory, Error, CreateSubcategoryPayload>({
    mutationFn: createSubcategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: subcategoryKeys.all });
    },
  });
}
