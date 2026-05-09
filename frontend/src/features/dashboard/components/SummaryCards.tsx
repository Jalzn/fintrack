import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBalanceQuery } from '@/features/transactions/hooks/use-balance-query';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { MoneySnapshot } from '@/types/api';

const BRL = { code: 'BRL', base: 10, exponent: 2 };
const ZERO_MONEY: MoneySnapshot = { amount: 0, currency: BRL };

interface SummaryCardProps {
  label: string;
  value: MoneySnapshot;
  icon: React.ReactNode;
  accent: 'balance' | 'income' | 'expense';
  isLoading: boolean;
}

const accentClasses: Record<
  SummaryCardProps['accent'],
  { value: string; bg: string; iconText: string }
> = {
  balance: { value: 'text-balance', bg: 'bg-balance/10', iconText: 'text-balance' },
  income: { value: 'text-income', bg: 'bg-income/10', iconText: 'text-income' },
  expense: { value: 'text-expense', bg: 'bg-expense/10', iconText: 'text-expense' },
};

function SummaryCard({ label, value, icon, accent, isLoading }: SummaryCardProps) {
  const classes = accentClasses[accent];
  return (
    <Card className="relative">
      <CardContent className="space-y-4 py-2">
        <div className="flex items-start justify-between">
          <span className="font-medium text-muted-foreground text-sm">{label}</span>
          <span
            className={cn(
              'flex size-9 items-center justify-center rounded-lg',
              classes.bg,
              classes.iconText,
            )}
          >
            {icon}
          </span>
        </div>
        <div className="space-y-1">
          {isLoading ? (
            <Skeleton className="h-9 w-32" />
          ) : (
            <p
              className={cn(
                'font-heading font-semibold text-3xl tracking-tight tabular-nums',
                classes.value,
              )}
            >
              {formatMoney(value)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export function SummaryCards() {
  const range = useMemo(getMonthRange, []);
  const { data: balance, isLoading } = useBalanceQuery({
    startDate: range.startDate,
    endDate: range.endDate,
    currencyCode: 'BRL',
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SummaryCard
        label="Saldo (mês)"
        value={balance?.balance ?? ZERO_MONEY}
        icon={<Wallet className="size-4" />}
        accent="balance"
        isLoading={isLoading}
      />
      <SummaryCard
        label="Receitas (mês)"
        value={balance?.income ?? ZERO_MONEY}
        icon={<ArrowUpRight className="size-4" />}
        accent="income"
        isLoading={isLoading}
      />
      <SummaryCard
        label="Despesas (mês)"
        value={balance?.expense ?? ZERO_MONEY}
        icon={<ArrowDownRight className="size-4" />}
        accent="expense"
        isLoading={isLoading}
      />
    </div>
  );
}
