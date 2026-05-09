import { z } from 'zod';
import { apiFetch } from '@/lib/api-client';
import type { Category, TransactionType } from '@/types/api';

const transactionTypeSchema = z.enum(['INCOME', 'EXPENSE']);

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  type: transactionTypeSchema,
});

const categoriesSchema = z.array(categorySchema);

export interface CreateCategoryPayload {
  name: string;
  color: string;
  type: TransactionType;
}

export interface UpdateCategoryPayload {
  name?: string;
  color?: string;
}

export function listCategories(filters?: { type?: TransactionType }): Promise<Category[]> {
  const search = new URLSearchParams();
  if (filters?.type) search.set('type', filters.type);
  const qs = search.toString();
  return apiFetch<Category[]>(`/categories${qs ? `?${qs}` : ''}`, {
    schema: categoriesSchema,
  });
}

export function getCategoryById(id: string): Promise<Category> {
  return apiFetch<Category>(`/categories/${id}`, { schema: categorySchema });
}

export function createCategory(body: CreateCategoryPayload): Promise<Category> {
  return apiFetch<Category>('/categories', {
    method: 'POST',
    body,
    schema: categorySchema,
  });
}

export function updateCategory(id: string, body: UpdateCategoryPayload): Promise<Category> {
  return apiFetch<Category>(`/categories/${id}`, {
    method: 'PUT',
    body,
    schema: categorySchema,
  });
}

export function deleteCategory(id: string): Promise<void> {
  return apiFetch<void>(`/categories/${id}`, { method: 'DELETE' });
}
