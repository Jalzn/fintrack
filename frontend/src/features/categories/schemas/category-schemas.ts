import { z } from 'zod';

const HEX_COLOR = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(100, 'Máximo de 100 caracteres'),
  color: z.string().regex(HEX_COLOR, 'Cor inválida'),
  type: z.enum(['INCOME', 'EXPENSE'], { message: 'Selecione um tipo' }),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

export const categoryUpdateFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(100, 'Máximo de 100 caracteres'),
  color: z.string().regex(HEX_COLOR, 'Cor inválida'),
});

export type CategoryUpdateFormInput = z.infer<typeof categoryUpdateFormSchema>;
