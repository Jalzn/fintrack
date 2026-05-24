import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Budget } from '@/budgets/domain';
import { InMemoryBudgetRepository } from '@/budgets/infrastructure/persistence/repository/in-memory-budget.repository';
import { BRL, Money } from '@/shared/domain';
import {
  TransactionCreatedEvent,
  TransactionDeletedEvent,
  TransactionType,
  TransactionUpdatedEvent,
} from '@/transactions/domain';
import { BudgetSpentRecalculatorHandler } from './budget-spent-recalculator.handler';

const USER_ID = 'user-1';
const PERIOD = new Date(Date.UTC(2026, 4, 1));

function makeBudget(overrides: {
  id?: string;
  categoryId?: string;
  subcategoryId?: string | null;
  planned?: number;
}): Budget {
  const b = Budget.create({
    id: overrides.id ?? 'b-1',
    userId: USER_ID,
    name: overrides.id ?? 'Orçamento',
    color: '#4a8ee8',
    scopes: [
      {
        categoryId: overrides.categoryId ?? 'cat-1',
        subcategoryId: overrides.subcategoryId ?? null,
      },
    ],
    periodStart: PERIOD,
    planned: Money.of(overrides.planned ?? 50000, BRL),
  });
  b.clearDomainEvents();
  return b;
}

/**
 * Stubs the drizzle SUM call to return a fixed totalMinorUnits.
 * We don't try to validate the actual SQL — that's covered by integration tests.
 */
function makeFakeDb(totalMinorUnits: number): PostgresJsDatabase {
  const fakeQuery = {
    from: () => fakeQuery,
    where: () => Promise.resolve([{ total: String(totalMinorUnits) }]),
  };
  return { select: vi.fn(() => fakeQuery) } as unknown as PostgresJsDatabase;
}

const fakeLogger = { error: vi.fn(), info: vi.fn() } as unknown as {
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
};

describe('BudgetSpentRecalculatorHandler', () => {
  let budgetRepository: InMemoryBudgetRepository;

  beforeEach(() => {
    budgetRepository = new InMemoryBudgetRepository();
  });

  it('on transaction.created: recomputes spent for affected budget (umbrella)', async () => {
    const cat = makeBudget({ id: 'b-cat', subcategoryId: null });
    budgetRepository.seed([cat]);
    const handler = new BudgetSpentRecalculatorHandler(
      budgetRepository,
      makeFakeDb(30000),
      // biome-ignore lint/suspicious/noExplicitAny: test stub
      fakeLogger as any,
    );

    await handler.onCreated(
      new TransactionCreatedEvent({
        transactionId: 't-1',
        userId: USER_ID,
        amount: Money.of(30000, BRL).toSnapshot(),
        type: TransactionType.EXPENSE,
        categoryId: 'cat-1',
        subcategoryId: null,
        description: 'x',
        date: new Date(Date.UTC(2026, 4, 15)),
        createdAt: new Date(),
        linkedTransactionId: undefined,
      }),
    );

    const updated = await budgetRepository.findById('b-cat', USER_ID);
    expect(updated?.spent.toSnapshot().amount).toBe(30000);
  });

  it('on transaction.created: recomputes both umbrella and subcategory budgets', async () => {
    const cat = makeBudget({ id: 'b-cat', subcategoryId: null, planned: 200000 });
    const sub = makeBudget({ id: 'b-sub', subcategoryId: 'sub-1', planned: 50000 });
    budgetRepository.seed([cat, sub]);
    const handler = new BudgetSpentRecalculatorHandler(
      budgetRepository,
      makeFakeDb(20000),
      // biome-ignore lint/suspicious/noExplicitAny: test stub
      fakeLogger as any,
    );

    await handler.onCreated(
      new TransactionCreatedEvent({
        transactionId: 't-1',
        userId: USER_ID,
        amount: Money.of(20000, BRL).toSnapshot(),
        type: TransactionType.EXPENSE,
        categoryId: 'cat-1',
        subcategoryId: 'sub-1',
        description: 'x',
        date: new Date(Date.UTC(2026, 4, 15)),
        createdAt: new Date(),
        linkedTransactionId: undefined,
      }),
    );

    expect((await budgetRepository.findById('b-cat', USER_ID))?.spent.toSnapshot().amount).toBe(
      20000,
    );
    expect((await budgetRepository.findById('b-sub', USER_ID))?.spent.toSnapshot().amount).toBe(
      20000,
    );
  });

  it('on transaction.updated: recomputes both old and new affected budgets', async () => {
    const catA = makeBudget({ id: 'b-A', categoryId: 'cat-A' });
    const catB = makeBudget({ id: 'b-B', categoryId: 'cat-B' });
    budgetRepository.seed([catA, catB]);

    const handler = new BudgetSpentRecalculatorHandler(
      budgetRepository,
      makeFakeDb(0), // both budgets recomputed; SUM stub returns 0 for any call
      // biome-ignore lint/suspicious/noExplicitAny: test stub
      fakeLogger as any,
    );

    await handler.onUpdated(
      new TransactionUpdatedEvent({
        transactionId: 't-1',
        userId: USER_ID,
        amount: Money.of(10000, BRL).toSnapshot(),
        type: TransactionType.EXPENSE,
        categoryId: 'cat-B',
        subcategoryId: null,
        description: 'x',
        date: new Date(Date.UTC(2026, 4, 20)),
        previous: {
          amount: Money.of(15000, BRL).toSnapshot(),
          categoryId: 'cat-A',
          subcategoryId: null,
          date: new Date(Date.UTC(2026, 4, 5)),
        },
      }),
    );

    expect((await budgetRepository.findById('b-A', USER_ID))?.spent.toSnapshot().amount).toBe(0);
    expect((await budgetRepository.findById('b-B', USER_ID))?.spent.toSnapshot().amount).toBe(0);
  });

  it('on transaction.deleted: recomputes affected budget', async () => {
    const cat = makeBudget({ id: 'b-cat', planned: 50000 });
    cat.replaceSpent(Money.of(30000, BRL));
    budgetRepository.seed([cat]);

    const handler = new BudgetSpentRecalculatorHandler(
      budgetRepository,
      makeFakeDb(0), // after deletion the SUM is now 0
      // biome-ignore lint/suspicious/noExplicitAny: test stub
      fakeLogger as any,
    );

    await handler.onDeleted(
      new TransactionDeletedEvent({
        transactionId: 't-1',
        userId: USER_ID,
        amount: Money.of(30000, BRL).toSnapshot(),
        type: TransactionType.EXPENSE,
        categoryId: 'cat-1',
        subcategoryId: null,
        date: new Date(Date.UTC(2026, 4, 10)),
        linkedTransactionId: undefined,
      }),
    );

    expect((await budgetRepository.findById('b-cat', USER_ID))?.spent.toSnapshot().amount).toBe(0);
  });

  it('does not crash when no budget is affected', async () => {
    const handler = new BudgetSpentRecalculatorHandler(
      budgetRepository,
      makeFakeDb(0),
      // biome-ignore lint/suspicious/noExplicitAny: test stub
      fakeLogger as any,
    );

    await expect(
      handler.onCreated(
        new TransactionCreatedEvent({
          transactionId: 't-1',
          userId: USER_ID,
          amount: Money.of(1000, BRL).toSnapshot(),
          type: TransactionType.EXPENSE,
          categoryId: 'cat-orphan',
          subcategoryId: null,
          description: 'x',
          date: new Date(Date.UTC(2026, 4, 1)),
          createdAt: new Date(),
          linkedTransactionId: undefined,
        }),
      ),
    ).resolves.toBeUndefined();
  });
});
