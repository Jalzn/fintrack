import { beforeEach, describe, expect, it } from 'vitest';
import { CategoryHasBudgetsError } from '@/budgets/application';
import { Budget } from '@/budgets/domain';
import { InMemoryBudgetRepository } from '@/budgets/infrastructure/persistence/repository/in-memory-budget.repository';
import { BRL, Money, USD } from '@/shared/domain';
import { InMemoryDomainEventDispatcher } from '@/shared/infrastructure';
import {
  Category,
  CategoryDeletedEvent,
  CategoryNotFoundError,
  Subcategory,
  Transaction,
  TransactionType,
} from '@/transactions/domain';
import {
  InMemoryCategoryRepository,
  InMemorySubcategoryRepository,
  InMemoryTransactionRepository,
} from '@/transactions/infrastructure';
import { CategoryHasSubcategoriesError, CategoryInUseError } from '../../errors';
import { DeleteCategoryUseCase } from './delete-category.use-case';

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

const makeSubcategory = (id: string, categoryId: string, name = 'Mercado') => {
  const s = Subcategory.create({ id, userId: USER_ID, categoryId, name });
  s.clearDomainEvents();
  return s;
};

const makeTransaction = (id = 'txn-1', categoryId = 'cat-1') => {
  const t = Transaction.create({
    id,
    userId: USER_ID,
    amount: Money.of(1000, USD),
    type: TransactionType.EXPENSE,
    categoryId,
    description: 'Test',
    date: new Date('2024-01-01'),
  });
  t.clearDomainEvents();
  return t;
};

describe('DeleteCategoryUseCase', () => {
  let categoryRepository: InMemoryCategoryRepository;
  let subcategoryRepository: InMemorySubcategoryRepository;
  let transactionRepository: InMemoryTransactionRepository;
  let budgetRepository: InMemoryBudgetRepository;
  let eventDispatcher: InMemoryDomainEventDispatcher;
  let useCase: DeleteCategoryUseCase;

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository();
    subcategoryRepository = new InMemorySubcategoryRepository();
    transactionRepository = new InMemoryTransactionRepository();
    budgetRepository = new InMemoryBudgetRepository();
    categoryRepository.setTransactionStore(transactionRepository.getStore());
    subcategoryRepository.setTransactionStore(transactionRepository.getStore());
    eventDispatcher = new InMemoryDomainEventDispatcher();
    useCase = new DeleteCategoryUseCase({
      categoryRepository,
      subcategoryRepository,
      budgetRepository,
      eventDispatcher,
    });
  });

  it('deletes the category and dispatches CategoryDeletedEvent', async () => {
    categoryRepository.seed([makeCategory()]);

    await useCase.execute({ id: 'cat-1', userId: USER_ID });

    expect(await categoryRepository.findById('cat-1', USER_ID)).toBeNull();
    expect(eventDispatcher.dispatched).toHaveLength(1);
    expect(eventDispatcher.dispatched[0]).toBeInstanceOf(CategoryDeletedEvent);
  });

  it('throws CategoryNotFoundError when category does not exist', async () => {
    await expect(useCase.execute({ id: 'nonexistent', userId: USER_ID })).rejects.toThrow(
      CategoryNotFoundError,
    );
  });

  it('throws CategoryHasSubcategoriesError when subcategories exist', async () => {
    categoryRepository.seed([makeCategory()]);
    subcategoryRepository.seed([makeSubcategory('sub-1', 'cat-1')]);

    await expect(useCase.execute({ id: 'cat-1', userId: USER_ID })).rejects.toThrow(
      CategoryHasSubcategoriesError,
    );
  });

  it('throws CategoryInUseError when transactions reference the category', async () => {
    categoryRepository.seed([makeCategory()]);
    transactionRepository.seed([makeTransaction()]);

    await expect(useCase.execute({ id: 'cat-1', userId: USER_ID })).rejects.toThrow(
      CategoryInUseError,
    );
  });

  it('CategoryInUseError carries the transaction count', async () => {
    categoryRepository.seed([makeCategory()]);
    transactionRepository.seed([makeTransaction('txn-1'), makeTransaction('txn-2')]);

    await expect(useCase.execute({ id: 'cat-1', userId: USER_ID })).rejects.toMatchObject({
      transactionCount: 2,
    });
  });

  it('throws CategoryHasBudgetsError when budgets reference the category', async () => {
    categoryRepository.seed([makeCategory()]);
    const b = Budget.create({
      id: 'b-1',
      userId: USER_ID,
      name: 'Orçamento',
      color: '#4a8ee8',
      scopes: [{ categoryId: 'cat-1', subcategoryId: null }],
      periodStart: new Date(Date.UTC(2026, 4, 1)),
      planned: Money.of(50000, BRL),
    });
    b.clearDomainEvents();
    budgetRepository.seed([b]);

    await expect(useCase.execute({ id: 'cat-1', userId: USER_ID })).rejects.toThrow(
      CategoryHasBudgetsError,
    );
  });
});
