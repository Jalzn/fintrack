import { beforeEach, describe, expect, it } from 'vitest';
import { Category, CategoryNotFoundError, TransactionType } from '@/transactions/domain';
import { InMemoryCategoryRepository } from '@/transactions/infrastructure';
import { GetCategoryByIdUseCase } from './get-category-by-id.use-case';

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

describe('GetCategoryByIdUseCase', () => {
  let categoryRepository: InMemoryCategoryRepository;
  let useCase: GetCategoryByIdUseCase;

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository();
    useCase = new GetCategoryByIdUseCase({ categoryRepository });
  });

  it('returns a DTO for an existing category', async () => {
    categoryRepository.seed([makeCategory()]);
    const dto = await useCase.execute({ id: 'cat-1', userId: USER_ID });
    expect(dto.id).toBe('cat-1');
    expect(dto.name).toBe('Food');
  });

  it('throws CategoryNotFoundError when not found', async () => {
    await expect(useCase.execute({ id: 'ghost', userId: USER_ID })).rejects.toThrow(
      CategoryNotFoundError,
    );
  });

  it('throws CategoryNotFoundError when userId does not match', async () => {
    categoryRepository.seed([makeCategory()]);
    await expect(useCase.execute({ id: 'cat-1', userId: 'other-user' })).rejects.toThrow(
      CategoryNotFoundError,
    );
  });
});
