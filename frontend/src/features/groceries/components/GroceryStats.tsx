import { Receipt, ShoppingBasket, TrendingUp, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Sparkline } from '@/components/Sparkline';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { moneyToNumber } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { MoneySnapshot } from '@/types/api';
import type { PriceRiser } from '../lib/grocery-insights';

interface GroceryStatsProps {
  currentSpend: MoneySnapshot;
  previousSpend: MoneySnapshot;
  trend: { value: number }[];
  visits: number;
  topRiser: PriceRiser | null;
  isLoading: boolean;
}

export function GroceryStats({
  currentSpend,
  previousSpend,
  trend,
  visits,
  topRiser,
  isLoading,
}: GroceryStatsProps) {
  const averageTicket: MoneySnapshot =
    visits > 0
      ? { amount: Math.round(currentSpend.amount / visits), currency: currentSpend.currency }
      : { amount: 0, currency: currentSpend.currency };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Gasto no período"
        value={currentSpend}
        accent="expense"
        emphasis="hero"
        icon={<Wallet className="size-4" aria-hidden />}
        delta={{
          current: moneyToNumber(currentSpend),
          previous: moneyToNumber(previousSpend),
          goodDirection: 'down',
        }}
        sparkline={isLoading ? undefined : <Sparkline data={trend} />}
        isLoading={isLoading}
      />
      <StatCard
        label="Ticket médio"
        value={averageTicket}
        accent="neutral"
        icon={<Receipt className="size-4" aria-hidden />}
        isLoading={isLoading}
      />
      <InfoStat
        label="Idas ao mercado"
        value={String(visits)}
        icon={<ShoppingBasket className="size-4" aria-hidden />}
        isLoading={isLoading}
      />
      {topRiser ? (
        <Link to="/mercado/precos" className="rounded-xl">
          <InfoStat
            label="Maior alta"
            value={`+${topRiser.risePct}%`}
            sub={topRiser.normalizedName}
            accent="expense"
            icon={<TrendingUp className="size-4" aria-hidden />}
            isLoading={isLoading}
            interactive
          />
        </Link>
      ) : (
        <InfoStat
          label="Maior alta"
          value="—"
          sub="sem altas relevantes"
          icon={<TrendingUp className="size-4" aria-hidden />}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

interface InfoStatProps {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  accent?: 'expense' | 'neutral';
  isLoading: boolean;
  interactive?: boolean;
}

function InfoStat({
  label,
  value,
  sub,
  icon,
  accent = 'neutral',
  isLoading,
  interactive = false,
}: InfoStatProps) {
  const isExpense = accent === 'expense';
  return (
    <Card className={cn('h-full', interactive && 'transition-colors hover:bg-accent')}>
      <CardContent className="space-y-3 py-2">
        <div className="flex items-start justify-between">
          <span className="font-medium text-muted-foreground text-sm">{label}</span>
          <span
            className={cn(
              'flex size-9 items-center justify-center rounded-lg',
              isExpense ? 'bg-expense/10 text-expense' : 'bg-muted text-muted-foreground',
            )}
          >
            {icon}
          </span>
        </div>
        <div className="space-y-1">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p
              className={cn(
                'font-heading font-semibold text-2xl tracking-tight tabular-nums',
                isExpense ? 'text-expense' : 'text-foreground',
              )}
            >
              {value}
            </p>
          )}
          {sub && !isLoading ? (
            <span className="block truncate text-muted-foreground text-xs capitalize">{sub}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
