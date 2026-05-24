import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { and, eq, gte, isNull, lt, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { PinoLogger } from 'nestjs-pino';
import type {
  Budget,
  BudgetCreatedEvent,
  BudgetUpdatedEvent,
  IBudgetRepository,
} from '@/budgets/domain';
import { type CurrencyCode, currencyByCode, Money } from '@/shared/domain';
import { DRIZZLE_DB } from '@/shared/infrastructure/database/drizzle.tokens';
import {
  type TransactionCreatedEvent,
  type TransactionDeletedEvent,
  TransactionType,
  type TransactionUpdatedEvent,
} from '@/transactions/domain';
import { transactions } from '@/transactions/infrastructure/persistence/schema';
import { BUDGET_REPOSITORY } from '../tokens';

interface Occurrence {
  userId: string;
  categoryId: string;
  subcategoryId: string | null;
  date: Date;
  currencyCode: string;
  type: TransactionType;
  linkedTransactionId: string | undefined;
}

@Injectable()
export class BudgetSpentRecalculatorHandler {
  constructor(
    @Inject(BUDGET_REPOSITORY) private readonly budgetRepository: IBudgetRepository,
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {}

  @OnEvent('transaction.created')
  async onCreated(event: TransactionCreatedEvent): Promise<void> {
    await this.recomputeForOccurrences([
      {
        userId: event.payload.userId,
        categoryId: event.payload.categoryId,
        subcategoryId: event.payload.subcategoryId,
        date: event.payload.date,
        currencyCode: event.payload.amount.currency.code,
        type: event.payload.type,
        linkedTransactionId: event.payload.linkedTransactionId,
      },
    ]);
  }

  @OnEvent('transaction.updated')
  async onUpdated(event: TransactionUpdatedEvent): Promise<void> {
    await this.recomputeForOccurrences([
      {
        userId: event.payload.userId,
        categoryId: event.payload.categoryId,
        subcategoryId: event.payload.subcategoryId,
        date: event.payload.date,
        currencyCode: event.payload.amount.currency.code,
        type: event.payload.type,
        linkedTransactionId: undefined,
      },
      {
        userId: event.payload.userId,
        categoryId: event.payload.previous.categoryId,
        subcategoryId: event.payload.previous.subcategoryId,
        date: event.payload.previous.date,
        currencyCode: event.payload.previous.amount.currency.code,
        type: event.payload.type,
        linkedTransactionId: undefined,
      },
    ]);
  }

  @OnEvent('transaction.deleted')
  async onDeleted(event: TransactionDeletedEvent): Promise<void> {
    await this.recomputeForOccurrences([
      {
        userId: event.payload.userId,
        categoryId: event.payload.categoryId,
        subcategoryId: event.payload.subcategoryId,
        date: event.payload.date,
        currencyCode: event.payload.amount.currency.code,
        type: event.payload.type,
        linkedTransactionId: event.payload.linkedTransactionId,
      },
    ]);
  }

  @OnEvent('budget.created')
  async onBudgetCreated(event: BudgetCreatedEvent): Promise<void> {
    await this.recomputeBudgetById(event.payload.budgetId, event.payload.userId);
  }

  @OnEvent('budget.updated')
  async onBudgetUpdated(event: BudgetUpdatedEvent): Promise<void> {
    await this.recomputeBudgetById(event.payload.budgetId, event.payload.userId);
  }

  private async recomputeBudgetById(budgetId: string, userId: string): Promise<void> {
    const budget = await this.budgetRepository.findById(budgetId, userId);
    if (!budget) return;
    try {
      await this.recomputeBudget(budget);
    } catch (err) {
      this.logger.error({ err, budgetId }, 'Failed to recompute budget spent');
    }
  }

  private async recomputeForOccurrences(occurrences: Occurrence[]): Promise<void> {
    const seen = new Set<string>();
    const budgetsToRecompute = new Map<string, Budget>();

    for (const occ of occurrences) {
      // Transferences (linked) and non-EXPENSE transactions never affect EXPENSE budgets,
      // BUT we still must recompute affected budgets in case the transaction PREVIOUSLY contributed.
      // The SUM filters those out anyway, so we always recompute the budget from scratch.
      const periodStart = firstOfMonthUtc(occ.date);
      const key = `${occ.userId}|${occ.categoryId}|${occ.subcategoryId ?? '∅'}|${periodStart.toISOString()}|${occ.currencyCode}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const affected = await this.budgetRepository.findAffectedByTransaction({
        userId: occ.userId,
        categoryId: occ.categoryId,
        subcategoryId: occ.subcategoryId,
        periodStart,
        currencyCode: occ.currencyCode,
      });
      for (const budget of affected) {
        budgetsToRecompute.set(budget.id, budget);
      }
    }

    for (const budget of budgetsToRecompute.values()) {
      try {
        await this.recomputeBudget(budget);
      } catch (err) {
        this.logger.error({ err, budgetId: budget.id }, 'Failed to recompute budget spent');
      }
    }
  }

  private async recomputeBudget(budget: Budget): Promise<void> {
    if (budget.scopes.length === 0) return;
    const periodEnd = nextMonthUtc(budget.periodStart);
    // A transaction counts when it matches ANY scope. A whole-category scope (subcategoryId null)
    // matches every subcategory; a pair scope matches only its own. The OR makes each row count once.
    const scopeConditions = budget.scopes.map((scope) =>
      scope.subcategoryId === null
        ? eq(transactions.categoryId, scope.categoryId)
        : and(
            eq(transactions.categoryId, scope.categoryId),
            eq(transactions.subcategoryId, scope.subcategoryId),
          ),
    );

    const [row] = await this.db
      .select({
        total: sql<string>`COALESCE(SUM(${transactions.amountMinorUnits}::bigint), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, budget.userId),
          eq(transactions.type, TransactionType.EXPENSE),
          eq(transactions.currencyCode, budget.currencyCode),
          gte(transactions.date, budget.periodStart),
          lt(transactions.date, periodEnd),
          isNull(transactions.linkedTransactionId),
          or(...scopeConditions),
        ),
      );

    const totalMinorUnits = Number(row?.total ?? 0);
    const currency = currencyByCode[budget.currencyCode as CurrencyCode];
    budget.replaceSpent(Money.of(totalMinorUnits, currency));
    await this.budgetRepository.save(budget);
  }
}

function firstOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function nextMonthUtc(periodStart: Date): Date {
  return new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 1));
}
