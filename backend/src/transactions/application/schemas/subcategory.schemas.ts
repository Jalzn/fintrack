import { z } from 'zod';

export const CreateSubcategoryInputSchema = z.object({
  userId: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().trim().min(1).max(100),
});
export type CreateSubcategoryInput = z.infer<typeof CreateSubcategoryInputSchema>;

export const GetSubcategoryByIdInputSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});
export type GetSubcategoryByIdInput = z.infer<typeof GetSubcategoryByIdInputSchema>;

export const DeleteSubcategoryInputSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});
export type DeleteSubcategoryInput = z.infer<typeof DeleteSubcategoryInputSchema>;

export const UpdateSubcategoryInputSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().trim().min(1).max(100).optional(),
});
export type UpdateSubcategoryInput = z.infer<typeof UpdateSubcategoryInputSchema>;

export const ListSubcategoriesInputSchema = z.object({
  userId: z.string().min(1),
  categoryId: z.string().min(1).optional(),
});
export type ListSubcategoriesInput = z.infer<typeof ListSubcategoriesInputSchema>;
