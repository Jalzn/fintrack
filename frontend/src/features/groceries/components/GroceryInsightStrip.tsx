import { ArrowUpRight, Clock, MapPin, TrendingDown, TrendingUp } from 'lucide-react';
import type { ComponentType } from 'react';
import { Link } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GroceryInsight, InsightKind, InsightTone } from '../lib/grocery-insights';

const kindIcon: Record<InsightKind, ComponentType<{ className?: string }>> = {
  rise: TrendingUp,
  drop: TrendingDown,
  'spend-up': ArrowUpRight,
  'best-store': MapPin,
  restock: Clock,
};

const toneClass: Record<InsightTone, string> = {
  warning: 'bg-expense/10 text-expense',
  positive: 'bg-income/10 text-income',
  neutral: 'bg-muted text-muted-foreground',
};

function InsightBody({ insight }: { insight: GroceryInsight }) {
  const Icon = kindIcon[insight.kind];
  return (
    <CardContent className="flex items-start gap-3 py-2">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          toneClass[insight.tone],
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="space-y-0.5">
        <p className="font-medium text-sm">{insight.title}</p>
        <p className="text-muted-foreground text-xs">{insight.detail}</p>
      </div>
    </CardContent>
  );
}

interface GroceryInsightStripProps {
  insights: GroceryInsight[];
}

/** Feed of actionable grocery insights. Renders nothing when there is nothing to say. */
export function GroceryInsightStrip({ insights }: GroceryInsightStripProps) {
  if (insights.length === 0) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {insights.map((insight) =>
        insight.href ? (
          <Link key={insight.id} to={insight.href} className="rounded-xl">
            <Card className="transition-colors hover:bg-accent">
              <InsightBody insight={insight} />
            </Card>
          </Link>
        ) : (
          <Card key={insight.id}>
            <InsightBody insight={insight} />
          </Card>
        ),
      )}
    </div>
  );
}
