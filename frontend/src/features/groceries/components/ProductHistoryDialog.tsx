import { format } from 'date-fns';
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney, moneyToNumber } from '@/lib/money';
import { usePriceAnalysisQuery } from '../hooks/use-price-analysis-query';

const chartConfig = {
  price: { label: 'Preço unit.', color: 'var(--chart-1)' },
  quantity: { label: 'Quantidade', color: 'var(--chart-2)' },
} satisfies ChartConfig;

interface ProductHistoryDialogProps {
  normalizedName: string | null;
  onOpenChange: (open: boolean) => void;
}

export function ProductHistoryDialog({ normalizedName, onOpenChange }: ProductHistoryDialogProps) {
  const { data, isLoading } = usePriceAnalysisQuery();
  const product = data?.products.find((item) => item.normalizedName === normalizedName);

  const rows =
    product?.occurrences.map((occurrence) => ({
      label: format(new Date(occurrence.date), 'dd/MM/yy'),
      price: moneyToNumber(occurrence.unitPrice),
      money: occurrence.unitPrice,
      quantity: occurrence.quantity,
      store: occurrence.storeName,
    })) ?? [];

  return (
    <Dialog open={normalizedName !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="capitalize">{normalizedName ?? 'Produto'}</DialogTitle>
          <DialogDescription>
            Evolução do preço unitário e da quantidade comprada ao longo do tempo.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sem histórico para este produto.</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <ComposedChart accessibilityLayer data={rows} margin={{ left: 4, right: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis yAxisId="price" tickLine={false} axisLine={false} width={36} />
              <YAxis
                yAxisId="quantity"
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <span className="flex w-full justify-between gap-3">
                        <span className="text-muted-foreground">
                          {name === 'price' ? 'Preço' : 'Qtd'}
                        </span>
                        <span className="font-medium font-mono tabular-nums">
                          {name === 'price' ? formatMoney(item.payload.money) : value}
                        </span>
                      </span>
                    )}
                  />
                }
              />
              <Bar
                yAxisId="quantity"
                dataKey="quantity"
                fill="var(--color-quantity)"
                radius={[4, 4, 0, 0]}
                fillOpacity={0.3}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke="var(--color-price)"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </DialogContent>
    </Dialog>
  );
}
