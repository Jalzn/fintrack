import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Category } from '@/types/api';
import { type UpdateCategoryPayload, updateCategory } from '../api/categories';
import { categoryKeys } from '../api/keys';

interface Variables {
  id: string;
  payload: UpdateCategoryPayload;
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation<Category, Error, Variables>({
    mutationFn: ({ id, payload }) => updateCategory(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
