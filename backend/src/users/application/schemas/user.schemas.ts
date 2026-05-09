import { z } from 'zod';

export const RegisterUserInputSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .refine((p) => /[A-Z]/.test(p), {
      message: 'Password must contain at least one uppercase letter',
    })
    .refine((p) => /[0-9]/.test(p), { message: 'Password must contain at least one number' })
    .refine((p) => /[^A-Za-z0-9]/.test(p), {
      message: 'Password must contain at least one special character',
    }),
});
export type RegisterUserInput = z.infer<typeof RegisterUserInputSchema>;

export const LoginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginUserInput = z.infer<typeof LoginUserInputSchema>;

export const RefreshTokenInputSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenInputSchema>;
