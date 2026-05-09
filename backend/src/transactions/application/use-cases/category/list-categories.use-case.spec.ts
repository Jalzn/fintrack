import { beforeEach, describe, expect, it } from 'vitest';
import { Category, TransactionType } from '@/transactions/domain';
import { InMemoryCategoryRepository } from '@/transactions/infrastructure';
import { ListCategoriesUseCase } from './list-categories.use-case';

const USER_ID = 'user-1';

const makeCategory = (id: string, type: TransactionType) => {
  const c = Category.create({ id, userId: USER_ID, name: `Cat ${id}`, color: '#AABBCC', type });
  c.clearDomainEvents();
  return c;
};

describe('ListCategoriesUseCase', () => {
  let categoryRepository: InMemoryCategoryRepository;
  let useCase: ListCategoriesUseCase;

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository();
    useCase = new ListCategoriesUseCase({ categoryRepository });
    categoryRepository.seed([
      makeCategory('cat-1', TransactionType.EXPENSE),
      makeCategory('cat-2', TransactionType.INCOME),
      makeCategory('cat-3', TransactionType.EXPENSE),
    ]);
  });

  it('lists all categories for user', async () => {
    const dtos = await useCase.execute({ userId: USER_ID });
    expect(dtos).toHaveLength(3);
  });

  it('filters by type', async () => {
    const dtos = await useCase.execute({ userId: USER_ID, type: TransactionType.EXPENSE });
    expect(dtos).toHaveLength(2);
    expect(dtos.every((d) => d.type === TransactionType.EXPENSE)).toBe(true);
  });

  it('returns only categories belonging to the requesting user', async () => {
    const dtos = await useCase.execute({ userId: 'other-user' });
    expect(dtos).toHaveLength(0);
  });
});
