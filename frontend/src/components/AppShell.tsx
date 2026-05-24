import { Outlet, useLocation } from 'react-router';
import { AppSidebar } from '@/components/AppSidebar';
import { PeriodSwitcher } from '@/components/PeriodSwitcher';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { usePeriod } from '@/hooks/use-period';

/** Routes where the global period selector is meaningful. */
const PERIOD_AWARE_PATHS = new Set(['/', '/transacoes', '/orcamentos']);

export function AppShell() {
  const location = useLocation();
  const { period, setPeriod } = usePeriod();
  const showPeriod =
    PERIOD_AWARE_PATHS.has(location.pathname) || location.pathname.startsWith('/mercado');

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {showPeriod ? <PeriodSwitcher period={period} onChange={setPeriod} /> : null}
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </SidebarInset>
      <Toaster richColors closeButton position="top-center" />
    </SidebarProvider>
  );
}
