import { beforeEach, describe, expect, it } from 'vitest';
import { Budget } from '@/budgets/domain';
import { InMemoryBudgetRepository } from '@/budgets/infrastructure/persistence/repository/in-memory-budget.repository';
import { BRL, Money } from '@/shared/domain';
import { InMemoryDomainEventDispatcher, InMemoryIdGenerator } from '@/shared/infrastructure';
import { CopyBudgetsFromPreviousMonthUseCase } from './copy-budgets-from-previous-month.use-case';

const USER_ID = 'user-1';

const seedBudgets = (repo: InMemoryBudgetRepository, periodStart: Date) => {
  const cat = Budget.create({
    id: `b-cat-${periodStart.toISOString()}`,
    userId: USER_ID,
    name: 'Mercado',
    color: '#1fba7a',
    scopes: [{ categoryId: 'cat-1', subcategoryId: null }],
    periodStart,
    planned: Money.of(50000, BRL),
  });
  const sub = Budget.create({
    id: `b-sub-${periodStart.toISOString()}`,
    userId: USER_ID,
    name: 'Mercado Carnes',
    color: '#e8614a',
    scopes: [{ categoryId: 'cat-1', subcategoryId: 'sub-1' }],
    periodStart,
    planned: Money.of(20000, BRL),
  });
  for (const b of [cat, sub]) b.clearDomainEvents();
  repo.seed([cat, sub]);
};

describe('CopyBudgetsFromPreviousMonthUseCase', () => {
  let budgetRepository: InMemoryBudgetRepository;
  let idGenerator: InMemoryIdGenerator;
  let eventDispatcher: InMemoryDomainEventDispatcher;
  let useCase: CopyBudgetsFromPreviousMonthUseCase;

  beforeEach(() => {
    budgetRepository = new InMemoryBudgetRepository();
    idGenerator = new InMemoryIdGenerator();
    eventDispatcher = new InMemoryDomainEventDispatcher();
    useCase = new CopyBudgetsFromPreviousMonthUseCase({
      budgetRepository,
      idGenerator,
      eventDispatcher,
    });
  });

  it('copies all source budgets to destination month with planned amount and zero spent', async () => {
    seedBudgets(budgetRepository, new Date(Date.UTC(2026, 4, 1)));
    const dtos = await useCase.execute({
      userId: USER_ID,
      fromPeriod: '2026-05',
      toPeriod: '2026-06',
    });
    expect(dtos).toHaveLength(2);
    for (const d of dtos) {
      expect(d.spent.amount).toBe(0);
      expect(d.periodStart).toBe('2026-06-01');
    }
    const destination = await budgetRepository.findByUserAndPeriod(
      USER_ID,
      new Date(Date.UTC(2026, 5, 1)),
    );
    expect(destination).toHaveLength(2);
  });

  it('skips budgets that already exist in destination month', async () => {
    seedBudgets(budgetRepository, new Date(Date.UTC(2026, 4, 1)));
    // Pre-create a budget with the same name already in June
    const existing = Budget.create({
      id: 'b-existing',
      userId: USER_ID,
      name: 'Mercado',
      color: '#1fba7a',
      scopes: [{ categoryId: 'cat-1', subcategoryId: null }],
      periodStart: new Date(Date.UTC(2026, 5, 1)),
      planned: Money.of(99999, BRL),
    });
    existing.clearDomainEvents();
    await budgetRepository.save(existing);

    const dtos = await useCase.execute({
      userId: USER_ID,
      fromPeriod: '2026-05',
      toPeriod: '2026-06',
    });
    // Only "Mercado Carnes" gets copied; "Mercado" already exists by name and is skipped
    expect(dtos).toHaveLength(1);
    expect(dtos[0]?.name).toBe('Mercado Carnes');
  });

  it('returns empty array when source month has no budgets', async () => {
    const dtos = await useCase.execute({
      userId: USER_ID,
      fromPeriod: '2026-04',
      toPeriod: '2026-05',
    });
    expect(dtos).toEqual([]);
  });

  it('rejects when fromPeriod equals toPeriod', async () => {
    await expect(
      useCase.execute({
        userId: USER_ID,
        fromPeriod: '2026-05',
        toPeriod: '2026-05',
      }),
    ).rejects.toThrow();
  });
});
