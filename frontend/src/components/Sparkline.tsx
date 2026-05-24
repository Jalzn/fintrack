import { Line, LineChart } from 'recharts';
import { type ChartConfig, ChartContainer } from '@/components/ui/chart';

const config = {
  value: { label: 'Saldo', color: 'var(--balance)' },
} satisfies ChartConfig;

interface SparklineProps {
  data: { value: number }[];
}

export function Sparkline({ data }: SparklineProps) {
  return (
    <ChartContainer config={config} className="h-10 w-full">
      <LineChart data={data} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
        <Line
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
