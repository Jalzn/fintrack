import { beforeEach, describe, expect, it } from 'vitest';
import { Budget, BudgetDeletedEvent, BudgetNotFoundError } from '@/budgets/domain';
import { InMemoryBudgetRepository } from '@/budgets/infrastructure/persistence/repository/in-memory-budget.repository';
import { BRL, Money } from '@/shared/domain';
import { InMemoryDomainEventDispatcher } from '@/shared/infrastructure';
import { DeleteBudgetUseCase } from './delete-budget.use-case';

const USER_ID = 'user-1';

describe('DeleteBudgetUseCase', () => {
  let budgetRepository: InMemoryBudgetRepository;
  let eventDispatcher: InMemoryDomainEventDispatcher;
  let useCase: DeleteBudgetUseCase;

  beforeEach(() => {
    budgetRepository = new InMemoryBudgetRepository();
    eventDispatcher = new InMemoryDomainEventDispatcher();
    useCase = new DeleteBudgetUseCase({ budgetRepository, eventDispatcher });
  });

  it('deletes the budget and dispatches BudgetDeletedEvent', async () => {
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

    await useCase.execute({ id: 'b-1', userId: USER_ID });
    expect(await budgetRepository.findById('b-1', USER_ID)).toBeNull();
    expect(eventDispatcher.dispatched[0]).toBeInstanceOf(BudgetDeletedEvent);
  });

  it('throws BudgetNotFoundError when budget does not exist', async () => {
    await expect(useCase.execute({ id: 'ghost', userId: USER_ID })).rejects.toThrow(
      BudgetNotFoundError,
    );
  });
});
