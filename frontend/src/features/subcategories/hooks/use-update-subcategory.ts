import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Subcategory } from '@/types/api';
import { subcategoryKeys } from '../api/keys';
import { type UpdateSubcategoryPayload, updateSubcategory } from '../api/subcategories';

interface Variables {
  id: string;
  payload: UpdateSubcategoryPayload;
}

export function useUpdateSubcategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation<Subcategory, Error, Variables>({
    mutationFn: ({ id, payload }) => updateSubcategory(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: subcategoryKeys.all });
    },
  });
}
