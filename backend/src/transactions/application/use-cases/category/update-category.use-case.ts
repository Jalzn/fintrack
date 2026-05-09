import type { IDomainEventDispatcher } from '@/shared/application';
import { CategoryNotFoundError, type ICategoryRepository } from '@/transactions/domain';
import type { CategoryDTO } from '../../dtos';
import { toCategoryDTO } from '../../mappers';
import { type UpdateCategoryInput, UpdateCategoryInputSchema } from '../../schemas';

interface Deps {
  categoryRepository: ICategoryRepository;
  eventDispatcher: IDomainEventDispatcher;
}

export class UpdateCategoryUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateCategoryInput): Promise<CategoryDTO> {
    const parsed = UpdateCategoryInputSchema.parse(input);

    const category = await this.deps.categoryRepository.findById(parsed.id, parsed.userId);
    if (!category) throw new CategoryNotFoundError(parsed.id);

    category.update({
      ...(parsed.name !== undefined && { name: parsed.name }),
      ...(parsed.color !== undefined && { color: parsed.color }),
    });

    await this.deps.categoryRepository.save(category);
    await this.deps.eventDispatcher.dispatch(category.domainEvents);
    category.clearDomainEvents();

    return toCategoryDTO(category);
  }
}
