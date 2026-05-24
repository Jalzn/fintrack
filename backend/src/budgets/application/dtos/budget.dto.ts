import type { MoneySnapshot } from '@/shared/domain';

export interface BudgetScopeDTO {
  categoryId: string;
  subcategoryId: string | null;
}

export interface BudgetDTO {
  id: string;
  name: string;
  color: string;
  scopes: BudgetScopeDTO[];
  /** ISO date string (YYYY-MM-DD), always first day of month, UTC. */
  periodStart: string;
  planned: MoneySnapshot;
  spent: MoneySnapshot;
  remaining: MoneySnapshot;
  /** Integer 0..n (no upper cap; can exceed 100 when overspent). */
  percentSpent: number;
  createdAt: Date;
  updatedAt: Date;
}
