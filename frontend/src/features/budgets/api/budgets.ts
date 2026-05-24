import { z } from 'zod';
import { apiFetch } from '@/lib/api-client';
import type { Budget, CurrencyCode } from '@/types/api';

const moneySnapshotSchema = z.object({
  amount: z.number(),
  currency: z.object({
    code: z.string(),
    base: z.number(),
    exponent: z.number(),
  }),
});

const budgetScopeSchema = z.object({
  categoryId: z.string(),
  subcategoryId: z.string().nullable(),
});

const budgetSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  scopes: z.array(budgetScopeSchema),
  periodStart: z.string(),
  planned: moneySnapshotSchema,
  spent: moneySnapshotSchema,
  remaining: moneySnapshotSchema,
  percentSpent: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const budgetsArraySchema = z.array(budgetSchema);

export interface BudgetScopePayload {
  categoryId: string;
  subcategoryId?: string | null;
}

export interface CreateBudgetPayload {
  name: string;
  color: string;
  scopes: BudgetScopePayload[];
  period: string;
  plannedMinorUnits: number;
  currencyCode: CurrencyCode;
}

export interface UpdateBudgetPayload {
  name: string;
  color: string;
  scopes: BudgetScopePayload[];
  plannedMinorUnits: number;
}

export interface CopyBudgetsPayload {
  fromPeriod: string;
  toPeriod: string;
}

export function listBudgets(period: string): Promise<Budget[]> {
  const search = new URLSearchParams({ period });
  return apiFetch<Budget[]>(`/budgets?${search.toString()}`, { schema: budgetsArraySchema });
}

export function getBudgetById(id: string): Promise<Budget> {
  return apiFetch<Budget>(`/budgets/${id}`, { schema: budgetSchema });
}

export function createBudget(body: CreateBudgetPayload): Promise<Budget> {
  return apiFetch<Budget>('/budgets', { method: 'POST', body, schema: budgetSchema });
}

export function updateBudget(id: string, body: UpdateBudgetPayload): Promise<Budget> {
  return apiFetch<Budget>(`/budgets/${id}`, { method: 'PUT', body, schema: budgetSchema });
}

export function deleteBudget(id: string): Promise<void> {
  return apiFetch<void>(`/budgets/${id}`, { method: 'DELETE' });
}

export function copyBudgets(body: CopyBudgetsPayload): Promise<Budget[]> {
  return apiFetch<Budget[]>('/budgets/copy', {
    method: 'POST',
    body,
    schema: budgetsArraySchema,
  });
}
