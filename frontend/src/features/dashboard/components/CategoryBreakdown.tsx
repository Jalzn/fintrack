import { useNavigate } from 'react-router';
import { Cell, Pie, PieChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { usePeriod } from '@/hooks/use-period';
import { colorFromHex } from '@/lib/category-colors';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { useCategorySpend } from '../hooks/use-category-spend';

export function CategoryBreakdown() {
  const { period } = usePeriod();
  const navigate = useNavigate();
  const { rows, totalMoney, isLoading } = useCategorySpend(period);

  const goToCategory = (categoryId: string) => {
    const params = new URLSearchParams({ type: 'EXPENSE', categoryId, period });
    navigate(`/transacoes?${params.toString()}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Por categoria</CardTitle>
        <CardDescription>Despesas do mês agrupadas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <Skeleton className="mx-auto h-48 w-48 rounded-full" />
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">Sem despesas neste mês.</p>
          </div>
        ) : (
          <>
            <div className="relative mx-auto aspect-square w-48">
              <ChartContainer config={{}} className="h-full w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="name"
                        formatter={(_value, _name, item) => formatMoney(item.payload.amount)}
                      />
                    }
                  />
                  <Pie
                    data={rows}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={82}
                    strokeWidth={2}
                    isAnimationActive={false}
                    onClick={(_, index) => {
                      const id = rows[index]?.id;
                      if (id) goToCategory(id);
                    }}
                  >
                    {rows.map((row) => (
                      <Cell key={row.id} fill={row.hex} className="cursor-pointer outline-none" />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-muted-foreground text-xs">Total</span>
                <span className="font-heading font-semibold text-lg tabular-nums">
                  {formatMoney(totalMoney)}
                </span>
              </div>
            </div>

            <ul className="space-y-1">
              {rows.map((row) => {
                const color = colorFromHex(row.hex);
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => goToCategory(row.id)}
                      className="flex w-full items-center gap-3 rounded-md px-1 py-1.5 text-left text-sm hover:bg-accent"
                    >
                      <span
                        className={cn('size-2.5 shrink-0 rounded-full', color.bgClass)}
                        aria-hidden
                      />
                      <span className="flex-1 truncate">{row.name}</span>
                      <span className="text-muted-foreground tabular-nums">{row.percent}%</span>
                      <span className="w-20 text-right font-medium tabular-nums">
                        {formatMoney(row.amount)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
