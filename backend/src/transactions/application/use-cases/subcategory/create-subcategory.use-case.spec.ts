import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryDomainEventDispatcher, InMemoryIdGenerator } from '@/shared/infrastructure';
import {
  Category,
  CategoryNotFoundError,
  Subcategory,
  SubcategoryCreatedEvent,
  TransactionType,
} from '@/transactions/domain';
import {
  InMemoryCategoryRepository,
  InMemorySubcategoryRepository,
} from '@/transactions/infrastructure';
import { SubcategoryNameAlreadyExistsError } from '../../errors';
import { CreateSubcategoryUseCase } from './create-subcategory.use-case';

const USER_ID = 'user-1';

const makeCategory = (id = 'cat-1') => {
  const c = Category.create({
    id,
    userId: USER_ID,
    name: 'Food',
    color: '#AABBCC',
    type: TransactionType.EXPENSE,
  });
  c.clearDomainEvents();
  return c;
};

describe('CreateSubcategoryUseCase', () => {
  let categoryRepository: InMemoryCategoryRepository;
  let subcategoryRepository: InMemorySubcategoryRepository;
  let idGenerator: InMemoryIdGenerator;
  let eventDispatcher: InMemoryDomainEventDispatcher;
  let useCase: CreateSubcategoryUseCase;

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository();
    subcategoryRepository = new InMemorySubcategoryRepository();
    idGenerator = new InMemoryIdGenerator();
    eventDispatcher = new InMemoryDomainEventDispatcher();
    useCase = new CreateSubcategoryUseCase({
      subcategoryRepository,
      categoryRepository,
      idGenerator,
      eventDispatcher,
    });
    categoryRepository.seed([makeCategory()]);
  });

  it('creates a subcategory and dispatches event', async () => {
    const dto = await useCase.execute({
      userId: USER_ID,
      categoryId: 'cat-1',
      name: 'Mercado',
    });
    expect(dto.id).toBe('id-1');
    expect(dto.categoryId).toBe('cat-1');
    expect(dto.name).toBe('Mercado');
    expect(eventDispatcher.dispatched[0]).toBeInstanceOf(SubcategoryCreatedEvent);
  });

  it('throws CategoryNotFoundError when category does not exist', async () => {
    await expect(
      useCase.execute({ userId: USER_ID, categoryId: 'nonexistent', name: 'x' }),
    ).rejects.toThrow(CategoryNotFoundError);
  });

  it('rejects duplicate name within the same category (case-insensitive)', async () => {
    const existing = Subcategory.create({
      id: 'sub-1',
      userId: USER_ID,
      categoryId: 'cat-1',
      name: 'Mercado',
    });
    existing.clearDomainEvents();
    await subcategoryRepository.save(existing);

    await expect(
      useCase.execute({ userId: USER_ID, categoryId: 'cat-1', name: 'mercado' }),
    ).rejects.toThrow(SubcategoryNameAlreadyExistsError);
  });
});
