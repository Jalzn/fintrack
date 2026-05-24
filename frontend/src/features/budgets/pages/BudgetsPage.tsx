import { Copy, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePeriod } from '@/hooks/use-period';
import { ApiError } from '@/lib/api-client';
import { previousPeriod } from '@/lib/period';
import type { Budget } from '@/types/api';
import { BudgetCard } from '../components/BudgetCard';
import { BudgetFormDialog } from '../components/BudgetFormDialog';
import { BudgetsOverview } from '../components/BudgetsOverview';
import { DeleteBudgetAlert } from '../components/DeleteBudgetAlert';
import { EmptyBudgetsState } from '../components/EmptyBudgetsState';
import { useBudgetsQuery } from '../hooks/use-budgets-query';
import { useCopyBudgetsMutation } from '../hooks/use-copy-budgets';

export function BudgetsPage() {
  const { period } = usePeriod();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState<Budget | null>(null);

  const { data: budgets, isLoading, isError } = useBudgetsQuery(period);
  const copyMutation = useCopyBudgetsMutation();

  const handleCopy = async () => {
    try {
      const copied = await copyMutation.mutateAsync({
        fromPeriod: previousPeriod(period),
        toPeriod: period,
      });
      if (copied.length === 0) {
        toast.info('Nenhum orçamento novo para copiar do mês anterior.');
      } else {
        toast.success(`${copied.length} orçamento(s) copiado(s).`);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao copiar orçamentos');
      }
    }
  };

  const hasBudgets = (budgets?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">
            Defina tetos de gastos por categoria e acompanhe seu progresso.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasBudgets ? (
            <>
              <Button
                variant="outline"
                onClick={handleCopy}
                disabled={copyMutation.isPending}
                className="gap-2"
              >
                <Copy aria-hidden className="size-4" />
                Copiar do mês anterior
              </Button>
              <Button onClick={() => setCreating(true)} className="gap-2">
                <Plus aria-hidden className="size-4" />
                Novo orçamento
              </Button>
            </>
          ) : null}
        </div>
      </header>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Carregando...
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-12 text-center text-destructive text-sm">
            Erro ao carregar orçamentos.
          </CardContent>
        </Card>
      ) : !hasBudgets ? (
        <EmptyBudgetsState
          onCreate={() => setCreating(true)}
          onCopyFromPrevious={handleCopy}
          copyDisabled={false}
          copyPending={copyMutation.isPending}
        />
      ) : (
        <div className="space-y-4">
          <BudgetsOverview budgets={budgets ?? []} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {budgets?.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={(b) => setEditing(b)}
                onDelete={(b) => setDeleting(b)}
              />
            ))}
          </div>
        </div>
      )}

      <BudgetFormDialog open={creating} onOpenChange={setCreating} defaultPeriod={period} />
      {editing !== null ? (
        <BudgetFormDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          initial={editing}
          defaultPeriod={period}
        />
      ) : null}
      <DeleteBudgetAlert
        budget={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </div>
  );
}
