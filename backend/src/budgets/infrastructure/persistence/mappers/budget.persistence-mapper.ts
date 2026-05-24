import { Budget } from '@/budgets/domain';
import type { CurrencyCode } from '@/shared/domain';
import { currencyByCode, Money } from '@/shared/domain';
import type { BudgetRow, BudgetScopeRow, NewBudgetRow, NewBudgetScopeRow } from '../schema';

export function budgetRowToDomain(row: BudgetRow, scopeRows: BudgetScopeRow[]): Budget {
  const currency = currencyByCode[row.currencyCode as CurrencyCode];
  const planned = Money.fromSnapshot({ amount: Number(row.plannedMinorUnits), currency });
  const spent = Money.fromSnapshot({ amount: Number(row.spentMinorUnits), currency });
  const periodStart = parsePeriodStart(row.periodStart);
  return Budget.restore({
    id: row.id,
    userId: row.userId,
    name: row.name,
    color: row.color,
    scopes: scopeRows.map((s) => ({ categoryId: s.categoryId, subcategoryId: s.subcategoryId })),
    periodStart,
    planned,
    spent,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function budgetToRow(budget: Budget): NewBudgetRow {
  const planned = budget.planned.toSnapshot();
  const spent = budget.spent.toSnapshot();
  return {
    id: budget.id,
    userId: budget.userId,
    name: budget.name,
    color: budget.color,
    periodStart: formatPeriodStart(budget.periodStart),
    currencyCode: planned.currency.code,
    plannedMinorUnits: String(planned.amount),
    spentMinorUnits: String(spent.amount),
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}

export function budgetScopesToRows(budget: Budget): NewBudgetScopeRow[] {
  return budget.scopes.map((scope) => ({
    id: crypto.randomUUID(),
    budgetId: budget.id,
    categoryId: scope.categoryId,
    subcategoryId: scope.subcategoryId,
  }));
}

/** Drizzle returns `date` columns as `YYYY-MM-DD` strings. We always interpret as UTC midnight. */
function parsePeriodStart(value: string | Date): Date {
  if (value instanceof Date) return value;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y as number, (m as number) - 1, d as number));
}

function formatPeriodStart(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
