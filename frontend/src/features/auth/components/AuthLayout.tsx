import { LineChart, PiggyBank, Wallet } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster } from '@/components/ui/sonner';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-green via-balance to-brand-purple text-white lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        <div className="-top-32 -right-32 absolute size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="-bottom-24 -left-24 absolute size-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Wallet className="size-5" />
          </div>
          <span className="font-heading font-semibold text-2xl tracking-tight">fintrack</span>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="font-heading font-semibold text-4xl leading-tight tracking-tight">
            Controle financeiro
            <br />
            <span className="text-white/80">sem ruído.</span>
          </h1>
          <p className="max-w-md text-base text-white/80 leading-relaxed">
            Registre receitas e despesas, organize por categorias e acompanhe seus saldos em tempo
            real — tudo em um só lugar.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <FeatureChip icon={<Wallet className="size-4" />} label="Saldo unificado" />
            <FeatureChip icon={<LineChart className="size-4" />} label="Tendências mensais" />
            <FeatureChip icon={<PiggyBank className="size-4" />} label="Categorias inteligentes" />
          </div>
        </div>

        <p className="relative z-10 text-sm text-white/60">
          © 2026 fintrack. Todos os direitos reservados.
        </p>
      </aside>

      <main className="relative flex flex-1 flex-col">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>

      <Toaster richColors closeButton position="top-center" />
    </div>
  );
}

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm backdrop-blur-sm ring-1 ring-white/20">
      {icon}
      {label}
    </span>
  );
}
