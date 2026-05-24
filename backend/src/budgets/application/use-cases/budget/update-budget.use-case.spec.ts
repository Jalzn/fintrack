import { beforeEach, describe, expect, it } from 'vitest';
import { Budget, BudgetNotFoundError, BudgetUpdatedEvent } from '@/budgets/domain';
import { InMemoryBudgetRepository } from '@/budgets/infrastructure/persistence/repository/in-memory-budget.repository';
import { BRL, Money } from '@/shared/domain';
import { InMemoryDomainEventDispatcher } from '@/shared/infrastructure';
import { Category, TransactionType } from '@/transactions/domain';
import {
  InMemoryCategoryRepository,
  InMemorySubcategoryRepository,
} from '@/transactions/infrastructure';
import { UpdateBudgetUseCase } from './update-budget.use-case';

const USER_ID = 'user-1';

const makeBudget = (userId = USER_ID) => {
  const b = Budget.create({
    id: 'b-1',
    userId,
    name: 'Original',
    color: '#4a8ee8',
    scopes: [{ categoryId: 'cat-1', subcategoryId: null }],
    periodStart: new Date(Date.UTC(2026, 4, 1)),
    planned: Money.of(50000, BRL),
  });
  b.clearDomainEvents();
  return b;
};

const updateInput = (overrides = {}) => ({
  id: 'b-1',
  userId: USER_ID,
  name: 'Atualizado',
  color: '#e8614a',
  scopes: [{ categoryId: 'cat-1', subcategoryId: null }],
  plannedMinorUnits: 75000,
  ...overrides,
});

describe('UpdateBudgetUseCase', () => {
  let budgetRepository: InMemoryBudgetRepository;
  let categoryRepository: InMemoryCategoryRepository;
  let subcategoryRepository: InMemorySubcategoryRepository;
  let eventDispatcher: InMemoryDomainEventDispatcher;
  let useCase: UpdateBudgetUseCase;

  beforeEach(() => {
    budgetRepository = new InMemoryBudgetRepository();
    categoryRepository = new InMemoryCategoryRepository();
    subcategoryRepository = new InMemorySubcategoryRepository();
    eventDispatcher = new InMemoryDomainEventDispatcher();
    useCase = new UpdateBudgetUseCase({
      budgetRepository,
      categoryRepository,
      subcategoryRepository,
      eventDispatcher,
    });
    const cat = Category.create({
      id: 'cat-1',
      userId: USER_ID,
      name: 'cat-1',
      color: '#AABBCC',
      type: TransactionType.EXPENSE,
    });
    cat.clearDomainEvents();
    categoryRepository.seed([cat]);
  });

  it('updates name, color, planned and scopes and emits BudgetUpdatedEvent', async () => {
    budgetRepository.seed([makeBudget()]);
    const dto = await useCase.execute(updateInput());
    expect(dto.name).toBe('Atualizado');
    expect(dto.color).toBe('#e8614a');
    expect(dto.planned.amount).toBe(75000);
    expect(eventDispatcher.dispatched.some((e) => e instanceof BudgetUpdatedEvent)).toBe(true);
  });

  it('throws BudgetNotFoundError when budget does not exist', async () => {
    await expect(useCase.execute(updateInput({ id: 'ghost' }))).rejects.toThrow(
      BudgetNotFoundError,
    );
  });

  it('does not update budget belonging to other user', async () => {
    budgetRepository.seed([makeBudget('other')]);
    await expect(useCase.execute(updateInput())).rejects.toThrow(BudgetNotFoundError);
  });
});
