import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCategory } from '../api/categories';
import { categoryKeys } from '../api/keys';

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
