import { z } from 'zod';

export const transactionFormSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Descrição obrigatória')
    .max(255, 'Máximo de 255 caracteres'),
  amountMinorUnits: z.number().int().positive('Valor deve ser maior que zero'),
  currencyCode: z.enum(['BRL', 'USD']),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  subcategoryId: z.string().nullable(),
  date: z.date(),
});

export type TransactionFormInput = z.infer<typeof transactionFormSchema>;
