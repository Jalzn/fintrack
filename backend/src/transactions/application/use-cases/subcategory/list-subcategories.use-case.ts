import type { ISubcategoryRepository } from '@/transactions/domain';
import type { SubcategoryDTO } from '../../dtos';
import { toSubcategoryDTO } from '../../mappers';
import { type ListSubcategoriesInput, ListSubcategoriesInputSchema } from '../../schemas';

interface Deps {
  subcategoryRepository: ISubcategoryRepository;
}

export class ListSubcategoriesUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ListSubcategoriesInput): Promise<SubcategoryDTO[]> {
    const parsed = ListSubcategoriesInputSchema.parse(input);
    const subcategories = parsed.categoryId
      ? await this.deps.subcategoryRepository.findAllByCategory(parsed.categoryId, parsed.userId)
      : await this.deps.subcategoryRepository.findAllByUser(parsed.userId);
    return subcategories.map(toSubcategoryDTO);
  }
}
