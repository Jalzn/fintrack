import { beforeEach, describe, expect, it } from 'vitest';
import { Budget, BudgetNotFoundError } from '@/budgets/domain';
import { InMemoryBudgetRepository } from '@/budgets/infrastructure/persistence/repository/in-memory-budget.repository';
import { BRL, Money } from '@/shared/domain';
import { GetBudgetByIdUseCase } from './get-budget-by-id.use-case';

describe('GetBudgetByIdUseCase', () => {
  let budgetRepository: InMemoryBudgetRepository;
  let useCase: GetBudgetByIdUseCase;

  beforeEach(() => {
    budgetRepository = new InMemoryBudgetRepository();
    useCase = new GetBudgetByIdUseCase({ budgetRepository });
  });

  it('returns BudgetDTO when found', async () => {
    const b = Budget.create({
      id: 'b-1',
      userId: 'u-1',
      name: 'Orçamento',
      color: '#4a8ee8',
      scopes: [{ categoryId: 'cat-1', subcategoryId: null }],
      periodStart: new Date(Date.UTC(2026, 4, 1)),
      planned: Money.of(50000, BRL),
    });
    b.clearDomainEvents();
    budgetRepository.seed([b]);
    const dto = await useCase.execute({ id: 'b-1', userId: 'u-1' });
    expect(dto.id).toBe('b-1');
  });

  it('throws BudgetNotFoundError when not found', async () => {
    await expect(useCase.execute({ id: 'ghost', userId: 'u-1' })).rejects.toThrow(
      BudgetNotFoundError,
    );
  });

  it('throws BudgetNotFoundError when userId mismatches', async () => {
    const b = Budget.create({
      id: 'b-1',
      userId: 'other',
      name: 'Orçamento',
      color: '#4a8ee8',
      scopes: [{ categoryId: 'cat-1', subcategoryId: null }],
      periodStart: new Date(Date.UTC(2026, 4, 1)),
      planned: Money.of(50000, BRL),
    });
    b.clearDomainEvents();
    budgetRepository.seed([b]);
    await expect(useCase.execute({ id: 'b-1', userId: 'u-1' })).rejects.toThrow(
      BudgetNotFoundError,
    );
  });
});
