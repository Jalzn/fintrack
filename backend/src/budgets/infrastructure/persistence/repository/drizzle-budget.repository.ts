import { Inject } from '@nestjs/common';
import { and, countDistinct, eq, inArray, isNull, or } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Budget, IBudgetRepository } from '@/budgets/domain';
import { DRIZZLE_DB } from '@/shared/infrastructure/database/drizzle.tokens';
import {
  budgetRowToDomain,
  budgetScopesToRows,
  budgetToRow,
} from '../mappers/budget.persistence-mapper';
import { type BudgetRow, budgetScopes, budgets } from '../schema';

export class DrizzleBudgetRepository implements IBudgetRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase) {}

  private async hydrate(rows: BudgetRow[]): Promise<Budget[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const scopeRows = await this.db
      .select()
      .from(budgetScopes)
      .where(inArray(budgetScopes.budgetId, ids));
    const byBudget = new Map<string, typeof scopeRows>();
    for (const scope of scopeRows) {
      const arr = byBudget.get(scope.budgetId) ?? [];
      arr.push(scope);
      byBudget.set(scope.budgetId, arr);
    }
    return rows.map((row) => budgetRowToDomain(row, byBudget.get(row.id) ?? []));
  }

  async findById(id: string, userId: string): Promise<Budget | null> {
    const rows = await this.db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .limit(1);
    const [budget] = await this.hydrate(rows);
    return budget ?? null;
  }

  async findByUserAndPeriod(userId: string, periodStart: Date): Promise<Budget[]> {
    const rows = await this.db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.periodStart, formatDate(periodStart))));
    return this.hydrate(rows);
  }

  async findAffectedByTransaction(args: {
    userId: string;
    categoryId: string;
    subcategoryId: string | null;
    periodStart: Date;
    currencyCode: string;
  }): Promise<Budget[]> {
    // A budget is affected when one of its scopes covers the transaction:
    //   scope.categoryId === tx.categoryId AND (scope.subcategoryId IS NULL OR === tx.subcategoryId)
    const subcategoryClause =
      args.subcategoryId !== null
        ? or(isNull(budgetScopes.subcategoryId), eq(budgetScopes.subcategoryId, args.subcategoryId))
        : isNull(budgetScopes.subcategoryId);

    const matched = await this.db
      .selectDistinct({ id: budgets.id })
      .from(budgets)
      .innerJoin(budgetScopes, eq(budgetScopes.budgetId, budgets.id))
      .where(
        and(
          eq(budgets.userId, args.userId),
          eq(budgets.periodStart, formatDate(args.periodStart)),
          eq(budgets.currencyCode, args.currencyCode),
          eq(budgetScopes.categoryId, args.categoryId),
          subcategoryClause,
        ),
      );

    if (matched.length === 0) return [];
    const rows = await this.db
      .select()
      .from(budgets)
      .where(
        inArray(
          budgets.id,
          matched.map((m) => m.id),
        ),
      );
    return this.hydrate(rows);
  }

  async countByCategory(categoryId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: countDistinct(budgetScopes.budgetId) })
      .from(budgetScopes)
      .where(eq(budgetScopes.categoryId, categoryId));
    return Number(row?.total ?? 0);
  }

  async countBySubcategory(subcategoryId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: countDistinct(budgetScopes.budgetId) })
      .from(budgetScopes)
      .where(eq(budgetScopes.subcategoryId, subcategoryId));
    return Number(row?.total ?? 0);
  }

  async save(budget: Budget): Promise<void> {
    const row = budgetToRow(budget);
    const scopeRows = budgetScopesToRows(budget);
    await this.db.transaction(async (tx) => {
      await tx.insert(budgets).values(row).onConflictDoUpdate({ target: budgets.id, set: row });
      await tx.delete(budgetScopes).where(eq(budgetScopes.budgetId, budget.id));
      if (scopeRows.length > 0) {
        await tx.insert(budgetScopes).values(scopeRows);
      }
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    // budget_scopes rows are removed via ON DELETE CASCADE.
    await this.db.delete(budgets).where(and(eq(budgets.id, id), eq(budgets.userId, userId)));
  }
}

function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
