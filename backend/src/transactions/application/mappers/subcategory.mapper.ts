import type { Subcategory } from '@/transactions/domain';
import type { SubcategoryDTO } from '../dtos';

export function toSubcategoryDTO(subcategory: Subcategory): SubcategoryDTO {
  return {
    id: subcategory.id,
    categoryId: subcategory.categoryId,
    name: subcategory.name,
  };
}
