import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { MoneySnapshot } from '@/types/api';

type Accent = 'balance' | 'income' | 'expense' | 'neutral';

const accentClasses: Record<Accent, { value: string; bg: string; iconText: string }> = {
  balance: { value: 'text-balance', bg: 'bg-balance/10', iconText: 'text-balance' },
  income: { value: 'text-income', bg: 'bg-income/10', iconText: 'text-income' },
  expense: { value: 'text-expense', bg: 'bg-expense/10', iconText: 'text-expense' },
  neutral: { value: 'text-foreground', bg: 'bg-muted', iconText: 'text-muted-foreground' },
};

const heroAccent: Record<Accent, string> = {
  balance: 'ring-balance/25 bg-gradient-to-br from-card to-balance/5',
  income: 'ring-income/25 bg-gradient-to-br from-card to-income/5',
  expense: 'ring-expense/25 bg-gradient-to-br from-card to-expense/5',
  neutral: 'ring-border',
};

export interface StatDelta {
  current: number;
  previous: number;
  /** Direction considered positive (green). Defaults to 'up'. */
  goodDirection?: 'up' | 'down';
}

interface StatCardProps {
  label: string;
  value: MoneySnapshot;
  accent?: Accent;
  icon?: ReactNode;
  delta?: StatDelta;
  sparkline?: ReactNode;
  emphasis?: 'hero' | 'default';
  isLoading?: boolean;
  className?: string;
}

function DeltaBadge({ delta }: { delta: StatDelta }) {
  const { current, previous, goodDirection = 'up' } = delta;

  if (previous === 0) {
    return <span className="text-muted-foreground text-xs">sem base no mês anterior</span>;
  }

  const pct = Math.round((Math.abs(current - previous) / Math.abs(previous)) * 100);
  const isUp = current >= previous;
  const isGood = isUp === (goodDirection === 'up');
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        'flex items-center gap-0.5 font-medium text-xs',
        isGood ? 'text-income' : 'text-expense',
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {pct}%<span className="font-normal text-muted-foreground">vs mês anterior</span>
    </span>
  );
}

export function StatCard({
  label,
  value,
  accent = 'neutral',
  icon,
  delta,
  sparkline,
  emphasis = 'default',
  isLoading = false,
  className,
}: StatCardProps) {
  const classes = accentClasses[accent];
  const isHero = emphasis === 'hero';

  return (
    <Card className={cn(isHero && ['ring-1', heroAccent[accent]], className)}>
      <CardContent className="space-y-3 py-2">
        <div className="flex items-start justify-between">
          <span className="font-medium text-muted-foreground text-sm">{label}</span>
          {icon ? (
            <span
              className={cn(
                'flex size-9 items-center justify-center rounded-lg',
                classes.bg,
                classes.iconText,
              )}
            >
              {icon}
            </span>
          ) : null}
        </div>
        <div className="space-y-1">
          {isLoading ? (
            <Skeleton className={isHero ? 'h-10 w-44' : 'h-8 w-32'} />
          ) : (
            <p
              className={cn(
                'font-heading font-semibold tracking-tight tabular-nums',
                classes.value,
                isHero ? 'text-4xl' : 'text-2xl',
              )}
            >
              {formatMoney(value)}
            </p>
          )}
          {delta && !isLoading ? <DeltaBadge delta={delta} /> : null}
        </div>
        {sparkline ? <div className="h-10">{sparkline}</div> : null}
      </CardContent>
    </Card>
  );
}
