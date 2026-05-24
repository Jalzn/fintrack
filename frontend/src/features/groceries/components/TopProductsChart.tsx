import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatMoney, moneyToNumber } from '@/lib/money';
import type { ProductSpend } from '@/types/api';

const chartConfig = {
  value: { label: 'Valor', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact' });

interface TopProductsChartProps {
  bySpend: ProductSpend[];
  byFrequency: ProductSpend[];
}

export function TopProductsChart({ bySpend, byFrequency }: TopProductsChartProps) {
  const [view, setView] = useState<'spend' | 'frequency'>('spend');
  const source = view === 'spend' ? bySpend : byFrequency;

  const rows = source.map((entry) => ({
    label: entry.normalizedName,
    value: view === 'spend' ? moneyToNumber(entry.totalSpend) : entry.purchaseCount,
    money: entry.totalSpend,
    count: entry.purchaseCount,
  }));

  return (
    <div className="space-y-3">
      <Tabs value={view} onValueChange={(value) => setView(value as 'spend' | 'frequency')}>
        <TabsList>
          <TabsTrigger value="spend">Por gasto</TabsTrigger>
          <TabsTrigger value="frequency">Por frequência</TabsTrigger>
        </TabsList>
      </Tabs>

      <ChartContainer config={chartConfig} className="h-72 w-full">
        <BarChart accessibilityLayer data={rows} layout="vertical" margin={{ left: 4, right: 4 }}>
          <CartesianGrid horizontal={false} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            allowDecimals={view === 'spend'}
            tickFormatter={(value: number) => compact.format(value)}
          />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            width={110}
            className="capitalize"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(_value, _name, item) =>
                  view === 'spend'
                    ? formatMoney(item.payload.money)
                    : `${item.payload.count} compras`
                }
              />
            }
          />
          <Bar dataKey="value" fill="var(--color-value)" radius={4} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
