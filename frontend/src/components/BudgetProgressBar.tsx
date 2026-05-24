import { cn } from '@/lib/utils';

interface BudgetProgressBarProps {
  percentSpent: number;
}

export function BudgetProgressBar({ percentSpent }: BudgetProgressBarProps) {
  const clampedWidth = Math.min(100, Math.max(0, percentSpent));
  const barColor =
    percentSpent >= 100 ? 'bg-expense' : percentSpent >= 75 ? 'bg-brand-gold' : 'bg-income';
  return (
    <div
      role="progressbar"
      aria-valuenow={percentSpent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${percentSpent}% gasto`}
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        className={cn('h-full rounded-full transition-all', barColor)}
        style={{ width: `${clampedWidth}%` }}
      />
    </div>
  );
}
