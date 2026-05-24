import { GrocerySettings } from '@/grocery-receipts/domain';
import type { GrocerySettingsRow, NewGrocerySettingsRow } from '../schema';

export function settingsRowToDomain(row: GrocerySettingsRow): GrocerySettings {
  return GrocerySettings.restore({
    userId: row.userId,
    categoryId: row.categoryId,
    subcategoryId: row.subcategoryId,
  });
}

export function settingsToRow(settings: GrocerySettings): NewGrocerySettingsRow {
  return {
    userId: settings.userId,
    categoryId: settings.categoryId,
    subcategoryId: settings.subcategoryId,
  };
}
