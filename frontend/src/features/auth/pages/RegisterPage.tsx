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
import { PasswordStrength } from '../components/PasswordStrength';
import { useRegisterMutation } from '../hooks/use-register';
import { type RegisterInput, registerSchema } from '../schemas/auth-schemas';

function getRegisterErrorMessage(error: unknown): string | null {
  if (error === null || error === undefined) return null;
  if (error instanceof NetworkError) {
    return 'Sem conexão com o servidor. Verifique sua internet ou tente novamente em instantes.';
  }
  if (error instanceof ApiError) {
    if (error.status === 409) return 'Já existe uma conta com este e-mail.';
    if (error.status === 400) return error.message;
    if (error.status >= 500) return 'O servidor está com problemas. Tente novamente em instantes.';
    return error.message;
  }
  return 'Não foi possível criar a conta. Tente novamente.';
}

export function RegisterPage() {
  const mutation = useRegisterMutation();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({ email: values.email, password: values.password });
  });

  const passwordValue = watch('password');
  const errorMessage = getRegisterErrorMessage(mutation.error);

  return (
    <AuthLayout>
      <AuthFormShell
        title="Criar conta"
        description="Comece grátis. Sem cartão, sem promessas vazias."
        footer={
          <span>
            Já tem conta?{' '}
            <Link
              to="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Entrar
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
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={errors.password !== undefined}
              aria-describedby="password-strength"
              {...register('password')}
            />
            <div id="password-strength">
              <PasswordStrength password={passwordValue} />
            </div>
            {errors.password !== undefined ? (
              <p className="text-destructive text-sm">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={errors.confirmPassword !== undefined}
              aria-describedby="confirmPassword-error"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword !== undefined ? (
              <p id="confirmPassword-error" className="text-destructive text-sm">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </Button>
        </form>
      </AuthFormShell>
    </AuthLayout>
  );
}
