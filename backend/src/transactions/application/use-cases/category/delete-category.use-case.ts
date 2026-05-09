import type { IDomainEventDispatcher } from '@/shared/application';
import {
  CategoryDeletedEvent,
  CategoryNotFoundError,
  type ICategoryRepository,
  type ISubcategoryRepository,
} from '@/transactions/domain';
import { CategoryHasSubcategoriesError, CategoryInUseError } from '../../errors';
import { type DeleteCategoryInput, DeleteCategoryInputSchema } from '../../schemas';

interface Deps {
  categoryRepository: ICategoryRepository;
  subcategoryRepository: ISubcategoryRepository;
  eventDispatcher: IDomainEventDispatcher;
}

export class DeleteCategoryUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteCategoryInput): Promise<void> {
    const parsed = DeleteCategoryInputSchema.parse(input);
    const category = await this.deps.categoryRepository.findById(parsed.id, parsed.userId);
    if (!category) throw new CategoryNotFoundError(parsed.id);

    const subcategoryCount = await this.deps.subcategoryRepository.countByCategory(
      parsed.id,
      parsed.userId,
    );
    if (subcategoryCount > 0) {
      throw new CategoryHasSubcategoriesError(parsed.id, subcategoryCount);
    }

    const { transactionCount } = await this.deps.categoryRepository.deleteIfUnused(
      parsed.id,
      parsed.userId,
    );
    if (transactionCount > 0) throw new CategoryInUseError(parsed.id, transactionCount);

    await this.deps.eventDispatcher.dispatch([new CategoryDeletedEvent(parsed.id)]);
  }
}
