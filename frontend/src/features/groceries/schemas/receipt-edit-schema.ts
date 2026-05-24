import { z } from 'zod';

export const receiptItemFormSchema = z.object({
  id: z.string().optional(),
  normalizedName: z.string().trim().min(1, 'Informe o nome').max(255, 'Máximo de 255 caracteres'),
  quantity: z
    .number({ message: 'Quantidade inválida' })
    .positive('Quantidade deve ser maior que zero'),
  unit: z.enum(['un', 'kg', 'L']),
  unitPriceMinorUnits: z.number().int().nonnegative('Preço inválido'),
  department: z.string().nullable(),
  brand: z.string().nullable(),
  size: z.string().nullable(),
  code: z.string().nullable(),
});

export const receiptEditFormSchema = z.object({
  storeName: z.string().trim().min(1, 'Informe o mercado').max(255, 'Máximo de 255 caracteres'),
  purchaseDate: z.date({ message: 'Selecione a data' }),
  totalMinorUnits: z.number().int().positive('Total deve ser maior que zero'),
  items: z.array(receiptItemFormSchema).min(1, 'Adicione ao menos um item'),
});

export type ReceiptEditFormInput = z.infer<typeof receiptEditFormSchema>;
