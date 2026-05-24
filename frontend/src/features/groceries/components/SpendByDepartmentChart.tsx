import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatMoney, moneyToNumber } from '@/lib/money';
import type { DepartmentSpend } from '@/types/api';
import { departmentLabel } from './department-labels';

const chartConfig = {
  value: { label: 'Gasto', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact' });

interface SpendByDepartmentChartProps {
  data: DepartmentSpend[];
}

export function SpendByDepartmentChart({ data }: SpendByDepartmentChartProps) {
  const rows = data.map((entry) => ({
    label: departmentLabel(entry.department),
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
        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={92} />
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
