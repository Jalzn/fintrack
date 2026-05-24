import { useCurrentUser } from '@/features/auth/hooks/use-current-user';

function getFirstName(email: string | undefined): string {
  if (email === undefined) return 'por aqui';
  const local = email.split('@')[0];
  if (local === undefined || local.length === 0) return 'por aqui';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function GreetingHeader() {
  const user = useCurrentUser();
  const name = getFirstName(user?.email);

  return <h1 className="font-heading font-semibold text-3xl tracking-tight">Olá, {name} 👋</h1>;
}
