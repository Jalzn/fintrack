import { z } from 'zod';
import { currencyCodeSchema, transactionTypeSchema } from './common.schemas';

export const CreateTransactionInputSchema = z.object({
  userId: z.string().min(1),
  amountMinorUnits: z.number().int().positive(),
  currencyCode: currencyCodeSchema,
  type: transactionTypeSchema,
  categoryId: z.string().min(1),
  subcategoryId: z.string().min(1).nullish(),
  description: z.string().trim().min(1).max(255),
  date: z.coerce.date(),
});
export type CreateTransactionInput = z.infer<typeof CreateTransactionInputSchema>;

export const GetTransactionByIdInputSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});
export type GetTransactionByIdInput = z.infer<typeof GetTransactionByIdInputSchema>;

export const DeleteTransactionInputSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});
export type DeleteTransactionInput = z.infer<typeof DeleteTransactionInputSchema>;

export const ListTransactionsInputSchema = z
  .object({
    userId: z.string().min(1),
    type: transactionTypeSchema.optional(),
    categoryId: z.string().min(1).optional(),
    subcategoryId: z.string().min(1).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, {
    message: 'startDate must be <= endDate',
  });
export type ListTransactionsInput = z.input<typeof ListTransactionsInputSchema>;

export const UpdateTransactionInputSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  amountMinorUnits: z.number().int().positive().optional(),
  categoryId: z.string().min(1).optional(),
  subcategoryId: z.string().min(1).nullish(),
  description: z.string().trim().min(1).max(255).optional(),
  date: z.coerce.date().optional(),
});
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionInputSchema>;

export const CalculateBalanceInputSchema = z
  .object({
    userId: z.string().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    currencyCode: currencyCodeSchema,
  })
  .refine((v) => v.startDate <= v.endDate, { message: 'startDate must be <= endDate' });
export type CalculateBalanceInput = z.infer<typeof CalculateBalanceInputSchema>;
