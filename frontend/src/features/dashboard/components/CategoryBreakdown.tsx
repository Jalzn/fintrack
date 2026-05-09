import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoriesQuery } from '@/features/categories/hooks/use-categories-query';
import { useTransactionsQuery } from '@/features/transactions/hooks/use-transactions-query';
import { CATEGORY_COLORS, colorFromHex } from '@/lib/category-colors';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { MoneySnapshot } from '@/types/api';

const BRL = { code: 'BRL', base: 10, exponent: 2 };
const FALLBACK_PALETTE = CATEGORY_COLORS.map((c) => c.hex);

interface BreakdownRow {
  id: string;
  label: string;
  amount: MoneySnapshot;
  percent: number;
  hex: string;
}

function getMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

function buildConicGradient(rows: BreakdownRow[]): string {
  if (rows.length === 0) return 'conic-gradient(var(--muted) 0% 100%)';
  const stops: string[] = [];
  let acc = 0;
  for (const row of rows) {
    const start = acc;
    const end = acc + row.percent;
    stops.push(`${row.hex} ${start}% ${end}%`);
    acc = end;
  }
  return `conic-gradient(${stops.join(', ')})`;
}

export function CategoryBreakdown() {
  const range = useMemo(getMonthRange, []);
  const { data: transactions, isLoading: isTxLoading } = useTransactionsQuery({
    type: 'EXPENSE',
    startDate: range.startDate,
    endDate: range.endDate,
    page: 1,
    limit: 100,
  });
  const { data: categories } = useCategoriesQuery();

  const { rows, total } = useMemo(() => {
    const txList = transactions?.data ?? [];
    if (txList.length === 0 || !categories) {
      return { rows: [] as BreakdownRow[], total: 0 };
    }

    const totals = new Map<string, number>();
    for (const tx of txList) {
      totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount.amount);
    }
    const grandTotal = [...totals.values()].reduce((a, b) => a + b, 0);
    if (grandTotal === 0) return { rows: [] as BreakdownRow[], total: 0 };

    const sorted = [...totals.entries()]
      .map(([categoryId, amount], idx) => {
        const cat = categories.find((c) => c.id === categoryId);
        const fallback = FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length] ?? '#999999';
        return {
          id: categoryId,
          label: cat?.name ?? 'Sem categoria',
          amount: { amount, currency: BRL } satisfies MoneySnapshot,
          percent: Math.round((amount / grandTotal) * 100),
          hex: cat?.color ?? fallback,
        };
      })
      .sort((a, b) => b.amount.amount - a.amount.amount);

    return { rows: sorted, total: grandTotal };
  }, [transactions, categories]);

  const conicStyle = useMemo(() => ({ backgroundImage: buildConicGradient(rows) }), [rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Por categoria</CardTitle>
        <CardDescription>Despesas do mês agrupadas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isTxLoading ? (
          <Skeleton className="mx-auto h-40 w-40 rounded-full" />
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">Sem despesas neste mês.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center py-2">
              <div
                className="relative flex size-40 items-center justify-center rounded-full"
                style={conicStyle}
                aria-hidden="true"
              >
                <div className="flex size-28 flex-col items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-foreground/5">
                  <span className="text-muted-foreground text-xs">Total</span>
                  <span className="font-heading font-semibold text-lg tabular-nums">
                    {formatMoney({ amount: total, currency: BRL })}
                  </span>
                </div>
              </div>
            </div>

            <ul className="space-y-3">
              {rows.map((row) => {
                const color = colorFromHex(row.hex);
                return (
                  <li key={row.id} className="flex items-center gap-3 text-sm">
                    <span
                      className={cn('size-2.5 shrink-0 rounded-full', color.bgClass)}
                      aria-hidden
                    />
                    <span className="flex-1 truncate">{row.label}</span>
                    <span className="text-muted-foreground tabular-nums">{row.percent}%</span>
                    <span className="w-20 text-right font-medium tabular-nums">
                      {formatMoney(row.amount)}
                    </span>
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
