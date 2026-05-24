import { beforeEach, describe, expect, it } from 'vitest';
import { BudgetCreatedEvent } from '@/budgets/domain';
import { InMemoryBudgetRepository } from '@/budgets/infrastructure/persistence/repository/in-memory-budget.repository';
import { InMemoryDomainEventDispatcher, InMemoryIdGenerator } from '@/shared/infrastructure';
import { Category, Subcategory, TransactionType } from '@/transactions/domain';
import {
  InMemoryCategoryRepository,
  InMemorySubcategoryRepository,
} from '@/transactions/infrastructure';
import {
  BudgetCategoryReferenceError,
  BudgetCategoryTypeError,
  BudgetSubcategoryMismatchError,
  BudgetSubcategoryReferenceError,
} from '../../errors';
import type { CreateBudgetInput } from '../../schemas';
import { CreateBudgetUseCase } from './create-budget.use-case';

const USER_ID = 'user-1';

const makeCategory = (id = 'cat-1', type = TransactionType.EXPENSE) => {
  const c = Category.create({ id, userId: USER_ID, name: id, color: '#AABBCC', type });
  c.clearDomainEvents();
  return c;
};

const makeSubcategory = (id: string, categoryId: string) => {
  const s = Subcategory.create({ id, userId: USER_ID, categoryId, name: id });
  s.clearDomainEvents();
  return s;
};

const validInput = (overrides: Partial<CreateBudgetInput> = {}): CreateBudgetInput => ({
  userId: USER_ID,
  name: 'Meu orçamento',
  color: '#4a8ee8',
  scopes: [{ categoryId: 'cat-1', subcategoryId: null }],
  period: '2026-05',
  plannedMinorUnits: 50000,
  currencyCode: 'BRL',
  ...overrides,
});

describe('CreateBudgetUseCase', () => {
  let budgetRepository: InMemoryBudgetRepository;
  let categoryRepository: InMemoryCategoryRepository;
  let subcategoryRepository: InMemorySubcategoryRepository;
  let idGenerator: InMemoryIdGenerator;
  let eventDispatcher: InMemoryDomainEventDispatcher;
  let useCase: CreateBudgetUseCase;

  beforeEach(() => {
    budgetRepository = new InMemoryBudgetRepository();
    categoryRepository = new InMemoryCategoryRepository();
    subcategoryRepository = new InMemorySubcategoryRepository();
    idGenerator = new InMemoryIdGenerator();
    eventDispatcher = new InMemoryDomainEventDispatcher();
    useCase = new CreateBudgetUseCase({
      budgetRepository,
      categoryRepository,
      subcategoryRepository,
      idGenerator,
      eventDispatcher,
    });
    categoryRepository.seed([
      makeCategory('cat-1'),
      makeCategory('cat-2'),
      makeCategory('cat-income', TransactionType.INCOME),
    ]);
    subcategoryRepository.seed([
      makeSubcategory('sub-1', 'cat-1'),
      makeSubcategory('sub-2', 'cat-2'),
    ]);
  });

  it('creates a named budget and dispatches event', async () => {
    const dto = await useCase.execute(validInput());
    expect(dto.id).toBe('id-1');
    expect(dto.name).toBe('Meu orçamento');
    expect(dto.color).toBe('#4a8ee8');
    expect(dto.scopes).toEqual([{ categoryId: 'cat-1', subcategoryId: null }]);
    expect(dto.planned.amount).toBe(50000);
    expect(dto.spent.amount).toBe(0);
    expect(dto.percentSpent).toBe(0);
    expect(dto.periodStart).toBe('2026-05-01');
    expect(eventDispatcher.dispatched.some((e) => e instanceof BudgetCreatedEvent)).toBe(true);
  });

  it('aggregates multiple scopes (category and pair)', async () => {
    const dto = await useCase.execute(
      validInput({
        scopes: [
          { categoryId: 'cat-1', subcategoryId: null },
          { categoryId: 'cat-2', subcategoryId: 'sub-2' },
        ],
      }),
    );
    expect(dto.scopes).toHaveLength(2);
  });

  it('throws BudgetCategoryReferenceError if a scope category does not exist', async () => {
    await expect(
      useCase.execute(validInput({ scopes: [{ categoryId: 'ghost', subcategoryId: null }] })),
    ).rejects.toThrow(BudgetCategoryReferenceError);
  });

  it('throws BudgetCategoryTypeError when a scope category is INCOME', async () => {
    await expect(
      useCase.execute(validInput({ scopes: [{ categoryId: 'cat-income', subcategoryId: null }] })),
    ).rejects.toThrow(BudgetCategoryTypeError);
  });

  it('throws BudgetSubcategoryReferenceError if a scope subcategory does not exist', async () => {
    await expect(
      useCase.execute(validInput({ scopes: [{ categoryId: 'cat-1', subcategoryId: 'ghost' }] })),
    ).rejects.toThrow(BudgetSubcategoryReferenceError);
  });

  it('throws BudgetSubcategoryMismatchError when subcategory belongs to other category', async () => {
    await expect(
      useCase.execute(validInput({ scopes: [{ categoryId: 'cat-1', subcategoryId: 'sub-2' }] })),
    ).rejects.toThrow(BudgetSubcategoryMismatchError);
  });

  it('allows overlapping budgets over the same category', async () => {
    await useCase.execute(validInput({ name: 'A' }));
    const dto = await useCase.execute(validInput({ name: 'B' }));
    expect(dto.name).toBe('B');
  });

  it('rejects invalid period format', async () => {
    await expect(useCase.execute(validInput({ period: '2026/05' }))).rejects.toThrow();
  });
});
