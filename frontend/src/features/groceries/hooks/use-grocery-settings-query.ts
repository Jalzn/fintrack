import { useQuery } from '@tanstack/react-query';
import type { GrocerySettings } from '@/types/api';
import { getGrocerySettings } from '../api/groceries';
import { groceryKeys } from '../api/keys';

export function useGrocerySettingsQuery() {
  return useQuery<GrocerySettings | null>({
    queryKey: groceryKeys.settings(),
    queryFn: getGrocerySettings,
  });
}
