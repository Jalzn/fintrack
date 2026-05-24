import { PiggyBank } from 'lucide-react';
import { Link } from 'react-router';
import { BudgetProgressBar } from '@/components/BudgetProgressBar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBudgetsQuery } from '@/features/budgets/hooks/use-budgets-query';
import { usePeriod } from '@/hooks/use-period';
import { colorFromHex } from '@/lib/category-colors';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

export function BudgetSnapshot() {
  const { period } = usePeriod();
  const { data: budgets, isLoading } = useBudgetsQuery(period);

  const top = [...(budgets ?? [])].sort((a, b) => b.percentSpent - a.percentSpent).slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Orçamentos do mês</CardTitle>
          <CardDescription>Onde você está mais perto do limite</CardDescription>
        </div>
        <Link
          to={`/orcamentos?period=${period}`}
          className="text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
        >
          Ver todos
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : top.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border border-dashed p-8 text-center">
            <PiggyBank className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-muted-foreground text-sm">
              Nenhum orçamento definido para este mês.
            </p>
            <Link
              to={`/orcamentos?period=${period}`}
              className="font-medium text-foreground text-sm underline-offset-4 hover:underline"
            >
              Criar orçamento
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {top.map((budget) => {
              const overspent = budget.percentSpent >= 100;
              return (
                <li key={budget.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium">
                      <span
                        className={cn(
                          'size-2.5 shrink-0 rounded-full',
                          colorFromHex(budget.color).bgClass,
                        )}
                        aria-hidden="true"
                      />
                      <span className="truncate">{budget.name}</span>
                      {overspent ? (
                        <Badge variant="destructive" className="text-xs">
                          Estourado
                        </Badge>
                      ) : null}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      <span
                        className={cn(
                          'font-medium',
                          overspent ? 'text-expense' : 'text-foreground',
                        )}
                      >
                        {formatMoney(budget.spent)}
                      </span>{' '}
                      / {formatMoney(budget.planned)}
                    </span>
                  </div>
                  <BudgetProgressBar percentSpent={budget.percentSpent} />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
