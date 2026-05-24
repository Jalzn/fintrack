import { z } from 'zod';
import { apiFetch } from '@/lib/api-client';
import type {
  GroceryReceipt,
  GrocerySettings,
  GrocerySummary,
  GroceryUnit,
  PaginatedReceipts,
  PriceAnalysis,
} from '@/types/api';
import type { GrocerySummaryParams, PriceAnalysisParams, ReceiptListFilters } from './keys';

const moneySnapshotSchema = z.object({
  amount: z.number(),
  currency: z.object({ code: z.string(), base: z.number(), exponent: z.number() }),
});

const groceryUnitSchema = z.enum(['un', 'kg', 'L']);

const groceryItemSchema = z.object({
  id: z.string(),
  rawDescription: z.string(),
  normalizedName: z.string(),
  quantity: z.number(),
  unit: groceryUnitSchema,
  unitPrice: moneySnapshotSchema,
  lineTotal: moneySnapshotSchema,
  brand: z.string().nullable(),
  code: z.string().nullable(),
  department: z.string().nullable(),
  size: z.string().nullable(),
});

const groceryReceiptSchema = z.object({
  id: z.string(),
  storeName: z.string(),
  purchaseDate: z.string(),
  total: moneySnapshotSchema,
  transactionId: z.string().nullable(),
  createdAt: z.string(),
  items: z.array(groceryItemSchema),
});

const paginatedReceiptsSchema = z.object({
  data: z.array(groceryReceiptSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

const priceOccurrenceSchema = z.object({
  date: z.string(),
  storeName: z.string(),
  unitPrice: moneySnapshotSchema,
  quantity: z.number(),
});

const priceAnalysisRowSchema = z.object({
  normalizedName: z.string(),
  count: z.number(),
  lastUnitPrice: moneySnapshotSchema,
  minUnitPrice: moneySnapshotSchema,
  maxUnitPrice: moneySnapshotSchema,
  avgUnitPrice: moneySnapshotSchema,
  occurrences: z.array(priceOccurrenceSchema),
});

const priceAnalysisSchema = z.object({ products: z.array(priceAnalysisRowSchema) });

const periodSpendSchema = z.object({ period: z.string(), spend: moneySnapshotSchema });
const departmentSpendSchema = z.object({ department: z.string(), spend: moneySnapshotSchema });
const storeSpendSchema = z.object({ storeName: z.string(), spend: moneySnapshotSchema });
const productSpendSchema = z.object({
  normalizedName: z.string(),
  totalSpend: moneySnapshotSchema,
  purchaseCount: z.number(),
});

const grocerySummarySchema = z.object({
  spendByPeriod: z.array(periodSpendSchema),
  byDepartment: z.array(departmentSpendSchema),
  byStore: z.array(storeSpendSchema),
  topProductsBySpend: z.array(productSpendSchema),
  topProductsByFrequency: z.array(productSpendSchema),
  currencyCode: z.string(),
});

export interface ImportReceiptPayload {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export function importReceipt(body: ImportReceiptPayload): Promise<GroceryReceipt> {
  return apiFetch<GroceryReceipt>('/grocery-receipts', {
    method: 'POST',
    body,
    schema: groceryReceiptSchema,
  });
}

export function listReceipts(filters: ReceiptListFilters): Promise<PaginatedReceipts> {
  const search = new URLSearchParams();
  search.set('page', String(filters.page));
  search.set('limit', String(filters.limit));
  if (filters.startDate) search.set('startDate', filters.startDate);
  if (filters.endDate) search.set('endDate', filters.endDate);

  return apiFetch<PaginatedReceipts>(`/grocery-receipts?${search.toString()}`, {
    schema: paginatedReceiptsSchema,
  });
}

export function getReceiptById(id: string): Promise<GroceryReceipt> {
  return apiFetch<GroceryReceipt>(`/grocery-receipts/${id}`, { schema: groceryReceiptSchema });
}

export interface UpdateReceiptItemPayload {
  id?: string;
  normalizedName: string;
  quantity: number;
  unit: GroceryUnit;
  unitPriceMinorUnits: number;
  brand?: string | null;
  code?: string | null;
  department?: string | null;
  size?: string | null;
}

export interface UpdateReceiptPayload {
  storeName: string;
  purchaseDate: string;
  totalMinorUnits: number;
  items: UpdateReceiptItemPayload[];
}

export function updateReceipt(id: string, body: UpdateReceiptPayload): Promise<GroceryReceipt> {
  return apiFetch<GroceryReceipt>(`/grocery-receipts/${id}`, {
    method: 'PUT',
    body,
    schema: groceryReceiptSchema,
  });
}

export function deleteReceipt(id: string): Promise<void> {
  return apiFetch<void>(`/grocery-receipts/${id}`, { method: 'DELETE' });
}

export function getPriceAnalysis(params: PriceAnalysisParams): Promise<PriceAnalysis> {
  const search = new URLSearchParams();
  if (params.startDate) search.set('startDate', params.startDate);
  if (params.endDate) search.set('endDate', params.endDate);
  const qs = search.toString();

  return apiFetch<PriceAnalysis>(`/grocery-receipts/price-analysis${qs ? `?${qs}` : ''}`, {
    schema: priceAnalysisSchema,
  });
}

export function getGrocerySummary(params: GrocerySummaryParams): Promise<GrocerySummary> {
  const search = new URLSearchParams();
  search.set('granularity', params.granularity);
  if (params.startDate) search.set('startDate', params.startDate);
  if (params.endDate) search.set('endDate', params.endDate);

  return apiFetch<GrocerySummary>(`/grocery-receipts/summary?${search.toString()}`, {
    schema: grocerySummarySchema,
  });
}

const grocerySettingsSchema = z.object({
  categoryId: z.string(),
  subcategoryId: z.string().nullable(),
});

const grocerySettingsResponseSchema = z.object({ settings: grocerySettingsSchema.nullable() });

export interface UpdateGrocerySettingsPayload {
  categoryId: string;
  subcategoryId: string | null;
}

export function getGrocerySettings(): Promise<GrocerySettings | null> {
  return apiFetch<{ settings: GrocerySettings | null }>('/grocery-receipts/settings', {
    schema: grocerySettingsResponseSchema,
  }).then((response) => response.settings);
}

export function updateGrocerySettings(
  body: UpdateGrocerySettingsPayload,
): Promise<GrocerySettings> {
  return apiFetch<GrocerySettings>('/grocery-receipts/settings', {
    method: 'PUT',
    body,
    schema: grocerySettingsSchema,
  });
}
