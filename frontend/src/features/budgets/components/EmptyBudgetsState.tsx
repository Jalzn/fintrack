import { PiggyBank, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyBudgetsStateProps {
  onCreate: () => void;
  onCopyFromPrevious: () => void;
  copyDisabled: boolean;
  copyPending: boolean;
}

export function EmptyBudgetsState({
  onCreate,
  onCopyFromPrevious,
  copyDisabled,
  copyPending,
}: EmptyBudgetsStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <PiggyBank aria-hidden className="size-12 text-muted-foreground" />
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">Nenhum orçamento neste mês</h3>
          <p className="max-w-md text-muted-foreground text-sm">
            Defina um teto de gastos por categoria para acompanhar seu progresso ao longo do mês.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onCreate}>
            <Plus className="size-4" /> Novo orçamento
          </Button>
          <Button
            variant="outline"
            onClick={onCopyFromPrevious}
            disabled={copyDisabled || copyPending}
          >
            Copiar do mês anterior
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
