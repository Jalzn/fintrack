import type { TransactionType } from '@/transactions/domain';
import { Category } from '@/transactions/domain';
import type { CategoryRow, NewCategoryRow } from '../schema';

export function categoryRowToDomain(row: CategoryRow): Category {
  return Category.restore({
    id: row.id,
    userId: row.userId,
    name: row.name,
    color: row.color,
    type: row.type as TransactionType,
  });
}

export function categoryToRow(category: Category): NewCategoryRow {
  return {
    id: category.id,
    userId: category.userId,
    name: category.name,
    color: category.color,
    type: category.type,
  };
}
