import { z } from 'zod';
import { TransactionType } from '@/transactions/domain';

export const transactionTypeSchema = z.enum([TransactionType.INCOME, TransactionType.EXPENSE]);

export const currencyCodeSchema = z.enum(['USD', 'BRL']);

export const hexColorSchema = z
  .string()
  .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, 'Invalid hex color');
