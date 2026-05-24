import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePeriod } from '@/hooks/use-period';
import { useMonthlyTrendQuery } from '../hooks/use-monthly-trend';
import { TrendChart } from './TrendChart';

export function EvolutionCard() {
  const { period } = usePeriod();
  const { points, isLoading } = useMonthlyTrendQuery(period, 6);
  const hasData = points.some((p) => p.income.amount !== 0 || p.expense.amount !== 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução</CardTitle>
        <CardDescription>Receitas, despesas e saldo nos últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : hasData ? (
          <TrendChart points={points} />
        ) : (
          <div className="rounded-lg border border-border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">Sem dados suficientes para o gráfico.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
