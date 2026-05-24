import { Gauge, Layers, PiggyBank, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { useBudgetsQuery } from '@/features/budgets/hooks/use-budgets-query';
import { usePeriod } from '@/hooks/use-period';
import { previousPeriod } from '@/lib/period';
import { cn } from '@/lib/utils';
import { useCategorySpend } from '../hooks/use-category-spend';
import { buildInsights, type Insight, type InsightIcon } from '../lib/insights';

const ICONS: Record<InsightIcon, typeof Layers> = {
  category: Layers,
  budget: PiggyBank,
  pace: Gauge,
  trend: TrendingUp,
};

const TONES: Record<Insight['tone'], string> = {
  neutral: 'border-border',
  warning: 'border-expense/40 bg-expense/5',
  positive: 'border-income/40 bg-income/5',
};

const TONE_ICON: Record<Insight['tone'], string> = {
  neutral: 'text-muted-foreground',
  warning: 'text-expense',
  positive: 'text-income',
};

export function InsightStrip() {
  const { period } = usePeriod();
  const now = useCategorySpend(period);
  const prev = useCategorySpend(previousPeriod(period));
  const { data: budgets } = useBudgetsQuery(period);

  const insights = useMemo(
    () =>
      buildInsights({
        period,
        expenseTotal: now.total,
        categoriesNow: now.rows.map((r) => ({ name: r.name, value: r.value })),
        categoriesPrev: prev.rows.map((r) => ({ name: r.name, value: r.value })),
        budgets: (budgets ?? []).map((b) => ({ name: b.name, percentSpent: b.percentSpent })),
      }),
    [period, now.total, now.rows, prev.rows, budgets],
  );

  if (insights.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {insights.map((insight) => {
        const Icon = ICONS[insight.icon];
        return (
          <div
            key={insight.id}
            className={cn('flex items-start gap-2.5 rounded-lg border p-3', TONES[insight.tone])}
          >
            <Icon className={cn('mt-0.5 size-4 shrink-0', TONE_ICON[insight.tone])} aria-hidden />
            <p className="text-sm leading-snug">{insight.text}</p>
          </div>
        );
      })}
    </div>
  );
}
