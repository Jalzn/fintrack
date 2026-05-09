import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoriesQuery } from '@/features/categories/hooks/use-categories-query';
import { useTransactionsQuery } from '@/features/transactions/hooks/use-transactions-query';
import { colorFromHex } from '@/lib/category-colors';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

export function RecentTransactions() {
  const { data, isLoading, isError } = useTransactionsQuery({ page: 1, limit: 5 });
  const { data: categories } = useCategoriesQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações recentes</CardTitle>
        <CardDescription>Últimos lançamentos da sua conta</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading ? (
          <div className="space-y-2 px-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isError ? (
          <p className="px-4 text-sm text-destructive">Erro ao carregar transações.</p>
        ) : !data || data.data.length === 0 ? (
          <div className="px-4 text-sm text-muted-foreground">
            Nenhuma transação ainda.{' '}
            <Link to="/transacoes" className="text-foreground underline-offset-4 hover:underline">
              Crie a primeira
            </Link>
            .
          </div>
        ) : (
          <ul className="divide-y">
            {data.data.map((t) => {
              const category = categories?.find((c) => c.id === t.categoryId);
              const color = colorFromHex(category?.color);
              return (
                <li key={t.id} className="flex items-center gap-4 px-4 py-3">
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-lg',
                      t.type === 'INCOME'
                        ? 'bg-income/10 text-income'
                        : 'bg-expense/10 text-expense',
                    )}
                  >
                    {t.type === 'INCOME' ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ArrowDownLeft className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{t.description}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-muted-foreground text-xs">
                      <Badge variant="outline" className="gap-1.5 font-normal">
                        <span
                          className={cn('size-1.5 rounded-full', color.bgClass)}
                          aria-hidden="true"
                        />
                        {category?.name ?? '—'}
                      </Badge>
                      <span>·</span>
                      <span>{format(new Date(t.date), "d 'de' MMM", { locale: ptBR })}</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 font-medium text-sm tabular-nums',
                      t.type === 'INCOME' ? 'text-income' : 'text-expense',
                    )}
                  >
                    {t.type === 'INCOME' ? '+' : '−'}
                    {formatMoney(t.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
