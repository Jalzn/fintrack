import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { moneyToNumber } from '@/lib/money';
import { formatPeriodShort } from '@/lib/period';
import type { MonthlyPoint } from '../hooks/use-monthly-trend';

const config = {
  income: { label: 'Receitas', color: 'var(--income)' },
  expense: { label: 'Despesas', color: 'var(--expense)' },
  balance: { label: 'Saldo', color: 'var(--balance)' },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact' });
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface TrendChartProps {
  points: MonthlyPoint[];
}

export function TrendChart({ points }: TrendChartProps) {
  const rows = points.map((p) => ({
    label: formatPeriodShort(p.period),
    income: moneyToNumber(p.income),
    expense: moneyToNumber(p.expense),
    balance: moneyToNumber(p.balance),
  }));

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <ComposedChart data={rows} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(value: number) => compact.format(value)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                const label = config[name as keyof typeof config]?.label ?? name;
                return `${String(label)}: ${currency.format(Number(value))}`;
              }}
            />
          }
        />
        <Bar dataKey="income" fill="var(--color-income)" radius={4} isAnimationActive={false} />
        <Bar dataKey="expense" fill="var(--color-expense)" radius={4} isAnimationActive={false} />
        <Line
          dataKey="balance"
          type="monotone"
          stroke="var(--color-balance)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
