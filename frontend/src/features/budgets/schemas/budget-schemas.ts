import { z } from 'zod';

const scopeSchema = z.object({
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  subcategoryId: z.string().nullable(),
});

export const budgetFormSchema = z.object({
  name: z.string().trim().min(1, 'Dê um nome ao orçamento').max(80, 'Nome muito longo'),
  color: z.string().min(1, 'Escolha uma cor'),
  scopes: z.array(scopeSchema).min(1, 'Adicione ao menos uma categoria'),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Período inválido'),
  plannedMinorUnits: z.number().int().positive('Valor deve ser maior que zero'),
  currencyCode: z.enum(['BRL', 'USD']),
});

export type BudgetFormInput = z.infer<typeof budgetFormSchema>;
