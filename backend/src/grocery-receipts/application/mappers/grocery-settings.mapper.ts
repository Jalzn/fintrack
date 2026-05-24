import type { GrocerySettings } from '@/grocery-receipts/domain';
import type { GrocerySettingsDTO } from '../dtos';

export function toGrocerySettingsDTO(settings: GrocerySettings): GrocerySettingsDTO {
  return {
    categoryId: settings.categoryId,
    subcategoryId: settings.subcategoryId,
  };
}
