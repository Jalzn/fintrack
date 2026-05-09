import { z } from 'zod';

export const subcategoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(100, 'Máximo de 100 caracteres'),
});

export type SubcategoryFormInput = z.infer<typeof subcategoryFormSchema>;
