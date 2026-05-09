import { Subcategory } from '@/transactions/domain';
import type { NewSubcategoryRow, SubcategoryRow } from '../schema';

export function subcategoryRowToDomain(row: SubcategoryRow): Subcategory {
  return Subcategory.restore({
    id: row.id,
    userId: row.userId,
    categoryId: row.categoryId,
    name: row.name,
  });
}

export function subcategoryToRow(subcategory: Subcategory): NewSubcategoryRow {
  return {
    id: subcategory.id,
    userId: subcategory.userId,
    categoryId: subcategory.categoryId,
    name: subcategory.name,
  };
}
