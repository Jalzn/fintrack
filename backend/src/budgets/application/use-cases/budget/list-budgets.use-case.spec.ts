import { beforeEach, describe, expect, it } from 'vitest';
import { Budget } from '@/budgets/domain';
import { InMemoryBudgetRepository } from '@/budgets/infrastructure/persistence/repository/in-memory-budget.repository';
import { BRL, Money } from '@/shared/domain';
import { ListBudgetsUseCase } from './list-budgets.use-case';

const USER_ID = 'user-1';

describe('ListBudgetsUseCase', () => {
  let budgetRepository: InMemoryBudgetRepository;
  let useCase: ListBudgetsUseCase;

  beforeEach(() => {
    budgetRepository = new InMemoryBudgetRepository();
    useCase = new ListBudgetsUseCase({ budgetRepository });
  });

  it('lists budgets only for the requested period and user', async () => {
    const may = Budget.create({
      id: 'b-may',
      userId: USER_ID,
      name: 'Orçamento',
      color: '#4a8ee8',
      scopes: [{ categoryId: 'cat-1', subcategoryId: null }],
      periodStart: new Date(Date.UTC(2026, 4, 1)),
      planned: Money.of(50000, BRL),
    });
    const june = Budget.create({
      id: 'b-jun',
      userId: USER_ID,
      name: 'Orçamento',
      color: '#4a8ee8',
      scopes: [{ categoryId: 'cat-1', subcategoryId: null }],
      periodStart: new Date(Date.UTC(2026, 5, 1)),
      planned: Money.of(60000, BRL),
    });
    const otherUser = Budget.create({
      id: 'b-other',
      userId: 'other',
      name: 'Orçamento',
      color: '#4a8ee8',
      scopes: [{ categoryId: 'cat-1', subcategoryId: null }],
      periodStart: new Date(Date.UTC(2026, 4, 1)),
      planned: Money.of(70000, BRL),
    });
    for (const b of [may, june, otherUser]) b.clearDomainEvents();
    budgetRepository.seed([may, june, otherUser]);

    const result = await useCase.execute({ userId: USER_ID, period: '2026-05' });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('b-may');
  });
});
