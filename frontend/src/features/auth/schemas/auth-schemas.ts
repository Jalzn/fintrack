import { z } from 'zod';

const emailField = z.string().trim().toLowerCase().pipe(z.string().email('E-mail inválido'));

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Informe sua senha'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const passwordRules = {
  length: (p: string) => p.length >= 8,
  uppercase: (p: string) => /[A-Z]/.test(p),
  number: (p: string) => /[0-9]/.test(p),
  symbol: (p: string) => /[^A-Za-z0-9]/.test(p),
} as const;

export const registerSchema = z
  .object({
    email: emailField,
    password: z
      .string()
      .min(8, 'Mínimo de 8 caracteres')
      .regex(/[A-Z]/, 'Inclua ao menos uma letra maiúscula')
      .regex(/[0-9]/, 'Inclua ao menos um número')
      .regex(/[^A-Za-z0-9]/, 'Inclua ao menos um caractere especial'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  });

export type RegisterInput = z.infer<typeof registerSchema>;
