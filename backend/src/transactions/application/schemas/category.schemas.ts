import { z } from 'zod';
import { hexColorSchema, transactionTypeSchema } from './common.schemas';

export const CreateCategoryInputSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  color: hexColorSchema,
  type: transactionTypeSchema,
});
export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>;

export const GetCategoryByIdInputSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});
export type GetCategoryByIdInput = z.infer<typeof GetCategoryByIdInputSchema>;

export const DeleteCategoryInputSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});
export type DeleteCategoryInput = z.infer<typeof DeleteCategoryInputSchema>;

export const UpdateCategoryInputSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().trim().min(1).max(100).optional(),
  color: hexColorSchema.optional(),
});
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryInputSchema>;

export const ListCategoriesInputSchema = z.object({
  userId: z.string().min(1),
  type: transactionTypeSchema.optional(),
});
export type ListCategoriesInput = z.infer<typeof ListCategoriesInputSchema>;
