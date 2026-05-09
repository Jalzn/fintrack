import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Category } from '@/types/api';
import { type CreateCategoryPayload, createCategory } from '../api/categories';
import { categoryKeys } from '../api/keys';

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation<Category, Error, CreateCategoryPayload>({
    mutationFn: createCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
