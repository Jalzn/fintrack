import type { IDomainEventDispatcher, IIdGenerator } from '@/shared/application';
import {
  CategoryNotFoundError,
  type ICategoryRepository,
  type ISubcategoryRepository,
  Subcategory,
} from '@/transactions/domain';
import type { SubcategoryDTO } from '../../dtos';
import { toSubcategoryDTO } from '../../mappers';
import { type CreateSubcategoryInput, CreateSubcategoryInputSchema } from '../../schemas';

interface Deps {
  subcategoryRepository: ISubcategoryRepository;
  categoryRepository: ICategoryRepository;
  idGenerator: IIdGenerator;
  eventDispatcher: IDomainEventDispatcher;
}

export class CreateSubcategoryUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateSubcategoryInput): Promise<SubcategoryDTO> {
    const parsed = CreateSubcategoryInputSchema.parse(input);

    const category = await this.deps.categoryRepository.findById(parsed.categoryId, parsed.userId);
    if (!category) throw new CategoryNotFoundError(parsed.categoryId);

    const id = this.deps.idGenerator.generate();
    const subcategory = Subcategory.create({
      id,
      userId: parsed.userId,
      categoryId: parsed.categoryId,
      name: parsed.name,
    });

    await this.deps.subcategoryRepository.save(subcategory);
    await this.deps.eventDispatcher.dispatch(subcategory.domainEvents);
    subcategory.clearDomainEvents();

    return toSubcategoryDTO(subcategory);
  }
}
