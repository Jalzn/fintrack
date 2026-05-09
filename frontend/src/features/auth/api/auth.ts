import { z } from 'zod';
import { apiFetch } from '@/lib/api-client';
import type { AuthToken } from '@/types/api';
import type { LoginInput } from '../schemas/auth-schemas';

const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  createdAt: z.string(),
});

const authTokenSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
});

export interface RegisterPayload {
  email: string;
  password: string;
}

export function loginUser(body: LoginInput): Promise<AuthToken> {
  return apiFetch<AuthToken>('/auth/login', {
    method: 'POST',
    body,
    schema: authTokenSchema,
  });
}

export function registerUser(body: RegisterPayload): Promise<AuthToken> {
  return apiFetch<AuthToken>('/auth/register', {
    method: 'POST',
    body,
    schema: authTokenSchema,
  });
}
