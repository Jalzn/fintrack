import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatMoney, moneyToNumber } from '@/lib/money';
import type { StoreSpend } from '@/types/api';

const chartConfig = {
  value: { label: 'Gasto', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact' });

interface SpendByStoreChartProps {
  data: StoreSpend[];
}

export function SpendByStoreChart({ data }: SpendByStoreChartProps) {
  const rows = data.map((entry) => ({
    label: entry.storeName,
    value: moneyToNumber(entry.spend),
    money: entry.spend,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart accessibilityLayer data={rows} layout="vertical" margin={{ left: 4, right: 4 }}>
        <CartesianGrid horizontal={false} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => compact.format(value)}
        />
        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={110} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(_value, _name, item) => formatMoney(item.payload.money)}
            />
          }
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}
