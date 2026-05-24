import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import { Sparkline } from '@/components/Sparkline';
import { StatCard } from '@/components/StatCard';
import { usePeriod } from '@/hooks/use-period';
import { moneyToNumber } from '@/lib/money';
import type { MoneySnapshot } from '@/types/api';
import { type MonthlyPoint, useMonthlyTrendQuery } from '../hooks/use-monthly-trend';

const BRL = { code: 'BRL', base: 10, exponent: 2 };
const ZERO: MoneySnapshot = { amount: 0, currency: BRL };

function emptyPoint(period: string): MonthlyPoint {
  return { period, income: ZERO, expense: ZERO, balance: ZERO };
}

export function SummaryCards() {
  const { period } = usePeriod();
  const { points, isLoading } = useMonthlyTrendQuery(period, 6);

  const current = points.at(-1) ?? emptyPoint(period);
  const previous = points.at(-2) ?? emptyPoint(period);
  const sparkData = points.map((p) => ({ value: moneyToNumber(p.balance) }));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr]">
      <StatCard
        label="Saldo do mês"
        value={current.balance}
        accent="balance"
        emphasis="hero"
        icon={<Wallet className="size-4" />}
        delta={{
          current: moneyToNumber(current.balance),
          previous: moneyToNumber(previous.balance),
        }}
        sparkline={isLoading ? undefined : <Sparkline data={sparkData} />}
        isLoading={isLoading}
      />
      <StatCard
        label="Receitas"
        value={current.income}
        accent="income"
        icon={<ArrowUpRight className="size-4" />}
        delta={{
          current: moneyToNumber(current.income),
          previous: moneyToNumber(previous.income),
        }}
        isLoading={isLoading}
      />
      <StatCard
        label="Despesas"
        value={current.expense}
        accent="expense"
        icon={<ArrowDownRight className="size-4" />}
        delta={{
          current: moneyToNumber(current.expense),
          previous: moneyToNumber(previous.expense),
          goodDirection: 'down',
        }}
        isLoading={isLoading}
      />
    </div>
  );
}
