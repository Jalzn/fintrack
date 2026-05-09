import type { Category } from '@/transactions/domain';
import type { CategoryDTO } from '../dtos';

export function toCategoryDTO(category: Category): CategoryDTO {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    type: category.type,
  };
}
