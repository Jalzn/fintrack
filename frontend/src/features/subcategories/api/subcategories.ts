import { z } from 'zod';
import { apiFetch } from '@/lib/api-client';
import type { Subcategory } from '@/types/api';

const subcategorySchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  name: z.string(),
});

const subcategoriesSchema = z.array(subcategorySchema);

export interface CreateSubcategoryPayload {
  categoryId: string;
  name: string;
}

export interface UpdateSubcategoryPayload {
  name?: string;
}

export function listSubcategories(filters?: { categoryId?: string }): Promise<Subcategory[]> {
  const search = new URLSearchParams();
  if (filters?.categoryId) search.set('categoryId', filters.categoryId);
  const qs = search.toString();
  return apiFetch<Subcategory[]>(`/subcategories${qs ? `?${qs}` : ''}`, {
    schema: subcategoriesSchema,
  });
}

export function createSubcategory(body: CreateSubcategoryPayload): Promise<Subcategory> {
  return apiFetch<Subcategory>('/subcategories', {
    method: 'POST',
    body,
    schema: subcategorySchema,
  });
}

export function updateSubcategory(
  id: string,
  body: UpdateSubcategoryPayload,
): Promise<Subcategory> {
  return apiFetch<Subcategory>(`/subcategories/${id}`, {
    method: 'PUT',
    body,
    schema: subcategorySchema,
  });
}

export function deleteSubcategory(id: string): Promise<void> {
  return apiFetch<void>(`/subcategories/${id}`, { method: 'DELETE' });
}
