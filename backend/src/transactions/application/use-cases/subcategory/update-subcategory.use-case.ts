import type { IDomainEventDispatcher } from '@/shared/application';
import { type ISubcategoryRepository, SubcategoryNotFoundError } from '@/transactions/domain';
import type { SubcategoryDTO } from '../../dtos';
import { toSubcategoryDTO } from '../../mappers';
import { type UpdateSubcategoryInput, UpdateSubcategoryInputSchema } from '../../schemas';

interface Deps {
  subcategoryRepository: ISubcategoryRepository;
  eventDispatcher: IDomainEventDispatcher;
}

export class UpdateSubcategoryUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateSubcategoryInput): Promise<SubcategoryDTO> {
    const parsed = UpdateSubcategoryInputSchema.parse(input);

    const subcategory = await this.deps.subcategoryRepository.findById(parsed.id, parsed.userId);
    if (!subcategory) throw new SubcategoryNotFoundError(parsed.id);

    subcategory.update({
      ...(parsed.name !== undefined && { name: parsed.name }),
    });

    await this.deps.subcategoryRepository.save(subcategory);
    await this.deps.eventDispatcher.dispatch(subcategory.domainEvents);
    subcategory.clearDomainEvents();

    return toSubcategoryDTO(subcategory);
  }
}
