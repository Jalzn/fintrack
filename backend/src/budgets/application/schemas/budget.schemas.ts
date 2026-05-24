import { z } from 'zod';
import { currencyCodeSchema } from '@/transactions/application';

const periodSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'period must be in YYYY-MM format');

const scopeInputSchema = z.object({
  categoryId: z.string().min(1),
  subcategoryId: z.string().min(1).nullish(),
});
export type BudgetScopeInput = z.infer<typeof scopeInputSchema>;

const nameSchema = z.string().trim().min(1).max(80);
const colorSchema = z.string().trim().min(1).max(20);
const scopesSchema = z.array(scopeInputSchema).min(1);

export const CreateBudgetInputSchema = z.object({
  userId: z.string().min(1),
  name: nameSchema,
  color: colorSchema,
  scopes: scopesSchema,
  period: periodSchema,
  plannedMinorUnits: z.number().int().positive(),
  currencyCode: currencyCodeSchema,
});
export type CreateBudgetInput = z.infer<typeof CreateBudgetInputSchema>;

export const UpdateBudgetInputSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: nameSchema,
  color: colorSchema,
  scopes: scopesSchema,
  plannedMinorUnits: z.number().int().positive(),
});
export type UpdateBudgetInput = z.infer<typeof UpdateBudgetInputSchema>;

export const DeleteBudgetInputSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});
export type DeleteBudgetInput = z.infer<typeof DeleteBudgetInputSchema>;

export const GetBudgetByIdInputSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});
export type GetBudgetByIdInput = z.infer<typeof GetBudgetByIdInputSchema>;

export const ListBudgetsInputSchema = z.object({
  userId: z.string().min(1),
  period: periodSchema,
});
export type ListBudgetsInput = z.infer<typeof ListBudgetsInputSchema>;

export const CopyBudgetsInputSchema = z
  .object({
    userId: z.string().min(1),
    fromPeriod: periodSchema,
    toPeriod: periodSchema,
  })
  .refine((v) => v.fromPeriod !== v.toPeriod, {
    message: 'fromPeriod and toPeriod must differ',
  });
export type CopyBudgetsInput = z.infer<typeof CopyBudgetsInputSchema>;

/** Converts 'YYYY-MM' to a UTC Date for the first day of that month. */
export function periodToDate(period: string): Date {
  const [y, m] = period.split('-').map(Number);
  return new Date(Date.UTC(y as number, (m as number) - 1, 1));
}
