import type { IDomainEventDispatcher } from '@/shared/application';
import {
  type ISubcategoryRepository,
  SubcategoryDeletedEvent,
  SubcategoryNotFoundError,
} from '@/transactions/domain';
import { SubcategoryInUseError } from '../../errors';
import { type DeleteSubcategoryInput, DeleteSubcategoryInputSchema } from '../../schemas';

interface Deps {
  subcategoryRepository: ISubcategoryRepository;
  eventDispatcher: IDomainEventDispatcher;
}

export class DeleteSubcategoryUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteSubcategoryInput): Promise<void> {
    const parsed = DeleteSubcategoryInputSchema.parse(input);
    const subcategory = await this.deps.subcategoryRepository.findById(parsed.id, parsed.userId);
    if (!subcategory) throw new SubcategoryNotFoundError(parsed.id);

    const { transactionCount } = await this.deps.subcategoryRepository.deleteIfUnused(
      parsed.id,
      parsed.userId,
    );
    if (transactionCount > 0) throw new SubcategoryInUseError(parsed.id, transactionCount);

    await this.deps.eventDispatcher.dispatch([new SubcategoryDeletedEvent(parsed.id)]);
  }
}
