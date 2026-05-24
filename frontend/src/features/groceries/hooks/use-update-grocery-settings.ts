import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GrocerySettings } from '@/types/api';
import { type UpdateGrocerySettingsPayload, updateGrocerySettings } from '../api/groceries';
import { groceryKeys } from '../api/keys';

export function useUpdateGrocerySettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation<GrocerySettings, Error, UpdateGrocerySettingsPayload>({
    mutationFn: updateGrocerySettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: groceryKeys.settings() });
    },
  });
}
