import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subcategoryKeys } from '../api/keys';
import { deleteSubcategory } from '../api/subcategories';

export function useDeleteSubcategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteSubcategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: subcategoryKeys.all });
    },
  });
}
