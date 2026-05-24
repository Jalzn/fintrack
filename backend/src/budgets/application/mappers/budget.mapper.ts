import type { Budget } from '@/budgets/domain';
import { Money } from '@/shared/domain';
import type { BudgetDTO } from '../dtos';

export function toBudgetDTO(budget: Budget): BudgetDTO {
  const planned = budget.planned.toSnapshot();
  const spent = budget.spent.toSnapshot();
  const remainingAmount = Math.max(0, planned.amount - spent.amount);
  const remaining = Money.fromSnapshot({
    amount: remainingAmount,
    currency: planned.currency,
  }).toSnapshot();
  const percentSpent = planned.amount === 0 ? 0 : Math.round((spent.amount / planned.amount) * 100);
  return {
    id: budget.id,
    name: budget.name,
    color: budget.color,
    scopes: budget.scopes.map((s) => ({
      categoryId: s.categoryId,
      subcategoryId: s.subcategoryId,
    })),
    periodStart: formatPeriodStart(budget.periodStart),
    planned,
    spent,
    remaining,
    percentSpent,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}

function formatPeriodStart(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
