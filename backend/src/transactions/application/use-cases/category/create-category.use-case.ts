import type { IDomainEventDispatcher, IIdGenerator } from '@/shared/application';
import { Category, type ICategoryRepository } from '@/transactions/domain';
import type { CategoryDTO } from '../../dtos';
import { toCategoryDTO } from '../../mappers';
import { type CreateCategoryInput, CreateCategoryInputSchema } from '../../schemas';

interface Deps {
  categoryRepository: ICategoryRepository;
  idGenerator: IIdGenerator;
  eventDispatcher: IDomainEventDispatcher;
}

export class CreateCategoryUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateCategoryInput): Promise<CategoryDTO> {
    const parsed = CreateCategoryInputSchema.parse(input);
    const id = this.deps.idGenerator.generate();

    const category = Category.create({
      id,
      userId: parsed.userId,
      name: parsed.name,
      color: parsed.color,
      type: parsed.type,
    });

    await this.deps.categoryRepository.save(category);
    await this.deps.eventDispatcher.dispatch(category.domainEvents);
    category.clearDomainEvents();

    return toCategoryDTO(category);
  }
}
