import { z } from 'zod';

export const GROCERY_DEPARTMENT_SLUGS = [
  'padaria',
  'hortifruti',
  'laticinios',
  'carnes',
  'aves-peixes',
  'bebidas',
  'mercearia',
  'limpeza',
  'higiene',
  'congelados',
  'doces-snacks',
  'pet',
  'outros',
] as const;

export const ExtractedItemSchema = z.object({
  rawDescription: z.string(),
  normalizedName: z.string(),
  quantity: z.number().positive(),
  unit: z.enum(['un', 'kg', 'L']),
  unitPriceReais: z.number().nonnegative(),
  lineTotalReais: z.number().nonnegative(),
  brand: z.string().nullable(),
  code: z.string().nullable(),
  department: z.enum(GROCERY_DEPARTMENT_SLUGS),
  size: z.string().nullable(),
});

export const ExtractedReceiptSchema = z.object({
  storeName: z.string().nullable(),
  purchaseDate: z.string().nullable(),
  currencyCode: z.enum(['BRL', 'USD']),
  totalReais: z.number().positive().nullable(),
  items: z.array(ExtractedItemSchema),
});

export type ExtractedItem = z.infer<typeof ExtractedItemSchema>;
export type ExtractedReceipt = z.infer<typeof ExtractedReceiptSchema>;
