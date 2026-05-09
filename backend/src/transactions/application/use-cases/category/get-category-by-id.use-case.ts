import { CategoryNotFoundError, type ICategoryRepository } from '@/transactions/domain';
import type { CategoryDTO } from '../../dtos';
import { toCategoryDTO } from '../../mappers';
import { type GetCategoryByIdInput, GetCategoryByIdInputSchema } from '../../schemas';

interface Deps {
  categoryRepository: ICategoryRepository;
}

export class GetCategoryByIdUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetCategoryByIdInput): Promise<CategoryDTO> {
    const parsed = GetCategoryByIdInputSchema.parse(input);
    const category = await this.deps.categoryRepository.findById(parsed.id, parsed.userId);
    if (!category) throw new CategoryNotFoundError(parsed.id);
    return toCategoryDTO(category);
  }
}
