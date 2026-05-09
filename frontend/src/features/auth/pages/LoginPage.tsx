import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, NetworkError } from '@/lib/api-client';
import { AuthFormShell } from '../components/AuthFormShell';
import { AuthLayout } from '../components/AuthLayout';
import { FormErrorBanner } from '../components/FormErrorBanner';
import { PasswordInput } from '../components/PasswordInput';
import { useLoginMutation } from '../hooks/use-login';
import { type LoginInput, loginSchema } from '../schemas/auth-schemas';

function getLoginErrorMessage(error: unknown): string | null {
  if (error === null || error === undefined) return null;
  if (error instanceof NetworkError) {
    return 'Sem conexão com o servidor. Verifique sua internet ou tente novamente em instantes.';
  }
  if (error instanceof ApiError) {
    if (error.status === 401) return 'E-mail ou senha inválidos.';
    if (error.status >= 500) return 'O servidor está com problemas. Tente novamente em instantes.';
    return error.message;
  }
  return 'Não foi possível entrar. Tente novamente.';
}

export function LoginPage() {
  const mutation = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));
  const errorMessage = getLoginErrorMessage(mutation.error);

  return (
    <AuthLayout>
      <AuthFormShell
        title="Entrar"
        description="Acesse sua conta para continuar acompanhando suas finanças."
        footer={
          <span>
            Ainda não tem conta?{' '}
            <Link
              to="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Criar conta
            </Link>
          </span>
        }
      >
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {errorMessage !== null ? <FormErrorBanner message={errorMessage} /> : null}

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="voce@email.com"
                className="pl-9"
                aria-invalid={errors.email !== undefined}
                aria-describedby="email-error"
                {...register('email')}
              />
            </div>
            {errors.email !== undefined ? (
              <p id="email-error" className="text-destructive text-sm">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={errors.password !== undefined}
              aria-describedby="password-error"
              {...register('password')}
            />
            {errors.password !== undefined ? (
              <p id="password-error" className="text-destructive text-sm">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </AuthFormShell>
    </AuthLayout>
  );
}
