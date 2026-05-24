import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatMoney, moneyToNumber } from '@/lib/money';
import type { PeriodSpend } from '@/types/api';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const chartConfig = {
  value: { label: 'Gasto', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact' });

function periodLabel(period: string): string {
  const weekMatch = period.match(/^\d{4}-W(\d{2})$/);
  if (weekMatch) return `Sem ${weekMatch[1]}`;
  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const year = monthMatch[1] ?? '';
    const monthNumber = monthMatch[2] ?? '';
    const month = MONTHS[Number(monthNumber) - 1] ?? monthNumber;
    return `${month}/${year.slice(2)}`;
  }
  return period;
}

interface SpendOverTimeChartProps {
  data: PeriodSpend[];
}

export function SpendOverTimeChart({ data }: SpendOverTimeChartProps) {
  const rows = data.map((entry) => ({
    label: periodLabel(entry.period),
    value: moneyToNumber(entry.spend),
    money: entry.spend,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart accessibilityLayer data={rows} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={36}
          tickFormatter={(value: number) => compact.format(value)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(_value, _name, item) => formatMoney(item.payload.money)}
            />
          }
        />
        <Bar
          dataKey="value"
          fill="var(--color-value)"
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  );
}
