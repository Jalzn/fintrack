import { z } from 'zod';

export const ImportReceiptInputSchema = z.object({
  userId: z.string().min(1),
  imageBase64: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});
export type ImportReceiptInput = z.infer<typeof ImportReceiptInputSchema>;

export const ListReceiptsInputSchema = z
  .object({
    userId: z.string().min(1),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, {
    message: 'startDate must be <= endDate',
  });
export type ListReceiptsInput = z.input<typeof ListReceiptsInputSchema>;

export const GetReceiptByIdInputSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});
export type GetReceiptByIdInput = z.infer<typeof GetReceiptByIdInputSchema>;

export const DeleteReceiptInputSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});
export type DeleteReceiptInput = z.infer<typeof DeleteReceiptInputSchema>;

export const AnalyzePricesInputSchema = z
  .object({
    userId: z.string().min(1),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, {
    message: 'startDate must be <= endDate',
  });
export type AnalyzePricesInput = z.input<typeof AnalyzePricesInputSchema>;

export const GetGrocerySummaryInputSchema = z
  .object({
    userId: z.string().min(1),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    granularity: z.enum(['week', 'month']).default('month'),
  })
  .refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, {
    message: 'startDate must be <= endDate',
  });
export type GetGrocerySummaryInput = z.input<typeof GetGrocerySummaryInputSchema>;

export const GetGrocerySettingsInputSchema = z.object({
  userId: z.string().min(1),
});
export type GetGrocerySettingsInput = z.infer<typeof GetGrocerySettingsInputSchema>;

export const UpdateGrocerySettingsInputSchema = z.object({
  userId: z.string().min(1),
  categoryId: z.string().min(1),
  subcategoryId: z.string().min(1).nullish(),
});
export type UpdateGrocerySettingsInput = z.infer<typeof UpdateGrocerySettingsInputSchema>;
