import type { ICategoryRepository } from '@/transactions/domain';
import type { CategoryDTO } from '../../dtos';
import { toCategoryDTO } from '../../mappers';
import { type ListCategoriesInput, ListCategoriesInputSchema } from '../../schemas';

interface Deps {
  categoryRepository: ICategoryRepository;
}

export class ListCategoriesUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ListCategoriesInput): Promise<CategoryDTO[]> {
    const parsed = ListCategoriesInputSchema.parse(input);
    const categories = parsed.type
      ? await this.deps.categoryRepository.findByType(parsed.userId, parsed.type)
      : await this.deps.categoryRepository.findAll(parsed.userId);
    return categories.map(toCategoryDTO);
  }
}
