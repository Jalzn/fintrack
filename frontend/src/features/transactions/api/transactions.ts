import { z } from 'zod';
import { apiFetch } from '@/lib/api-client';
import type {
  Balance,
  CurrencyCode,
  PaginatedTransactions,
  Transaction,
  TransactionType,
} from '@/types/api';
import type { BalanceParams, TransactionListFilters } from './keys';

const transactionTypeSchema = z.enum(['INCOME', 'EXPENSE']);

const moneySnapshotSchema = z.object({
  amount: z.number(),
  currency: z.object({
    code: z.string(),
    base: z.number(),
    exponent: z.number(),
  }),
});

const transactionSchema = z.object({
  id: z.string(),
  amount: moneySnapshotSchema,
  type: transactionTypeSchema,
  categoryId: z.string(),
  subcategoryId: z.string().nullable(),
  description: z.string(),
  date: z.string(),
  createdAt: z.string(),
});

const paginatedTransactionsSchema = z.object({
  data: z.array(transactionSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

const balanceSchema = z.object({
  balance: moneySnapshotSchema,
  income: moneySnapshotSchema,
  expense: moneySnapshotSchema,
  startDate: z.string(),
  endDate: z.string(),
});

export interface CreateTransactionPayload {
  amountMinorUnits: number;
  currencyCode: CurrencyCode;
  type: TransactionType;
  categoryId: string;
  subcategoryId?: string | null;
  description: string;
  date: string;
}

export interface UpdateTransactionPayload {
  amountMinorUnits?: number;
  categoryId?: string;
  subcategoryId?: string | null;
  description?: string;
  date?: string;
}

export function listTransactions(filters: TransactionListFilters): Promise<PaginatedTransactions> {
  const search = new URLSearchParams();
  search.set('page', String(filters.page));
  search.set('limit', String(filters.limit));
  if (filters.type) search.set('type', filters.type);
  if (filters.categoryId) search.set('categoryId', filters.categoryId);
  if (filters.subcategoryId) search.set('subcategoryId', filters.subcategoryId);
  if (filters.startDate) search.set('startDate', filters.startDate);
  if (filters.endDate) search.set('endDate', filters.endDate);

  return apiFetch<PaginatedTransactions>(`/transactions?${search.toString()}`, {
    schema: paginatedTransactionsSchema,
  });
}

export function getTransactionById(id: string): Promise<Transaction> {
  return apiFetch<Transaction>(`/transactions/${id}`, { schema: transactionSchema });
}

export function createTransaction(body: CreateTransactionPayload): Promise<Transaction> {
  return apiFetch<Transaction>('/transactions', {
    method: 'POST',
    body,
    schema: transactionSchema,
  });
}

export function updateTransaction(
  id: string,
  body: UpdateTransactionPayload,
): Promise<Transaction> {
  return apiFetch<Transaction>(`/transactions/${id}`, {
    method: 'PUT',
    body,
    schema: transactionSchema,
  });
}

export function deleteTransaction(id: string): Promise<void> {
  return apiFetch<void>(`/transactions/${id}`, { method: 'DELETE' });
}

export function getBalance(params: BalanceParams): Promise<Balance> {
  const search = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
    currencyCode: params.currencyCode,
  });
  return apiFetch<Balance>(`/transactions/balance?${search.toString()}`, {
    schema: balanceSchema,
  });
}
