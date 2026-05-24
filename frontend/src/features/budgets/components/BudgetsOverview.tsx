import { BudgetProgressBar } from '@/components/BudgetProgressBar';
import { Card, CardContent } from '@/components/ui/card';
import { formatMoney, subtractMoney, sumMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { Budget } from '@/types/api';

const BRL = { code: 'BRL', base: 10, exponent: 2 };

interface BudgetsOverviewProps {
  budgets: Budget[];
}

export function BudgetsOverview({ budgets }: BudgetsOverviewProps) {
  const planned = sumMoney(
    budgets.map((b) => b.planned),
    BRL,
  );
  const spent = sumMoney(
    budgets.map((b) => b.spent),
    BRL,
  );
  const remaining = subtractMoney(planned, spent);
  const percent = planned.amount > 0 ? Math.round((spent.amount / planned.amount) * 100) : 0;
  const overspentCount = budgets.filter((b) => b.percentSpent >= 100).length;
  const overspent = remaining.amount < 0;

  return (
    <Card>
      <CardContent className="space-y-3 py-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-medium text-muted-foreground text-sm">Total do mês</span>
          <span className="tabular-nums">
            <span
              className={cn(
                'font-heading font-semibold text-2xl tracking-tight',
                overspent ? 'text-expense' : 'text-foreground',
              )}
            >
              {formatMoney(spent)}
            </span>
            <span className="text-muted-foreground text-sm"> de {formatMoney(planned)}</span>
          </span>
        </div>
        <BudgetProgressBar percentSpent={percent} />
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span className="text-muted-foreground">{percent}% do planejado</span>
          <span className="text-muted-foreground">
            {overspent ? 'Excesso ' : 'Restante '}
            <span className={cn('font-medium', overspent ? 'text-expense' : 'text-foreground')}>
              {formatMoney(remaining)}
            </span>
            {overspentCount > 0 ? (
              <>
                {' · '}
                <span className="font-medium text-expense">
                  {overspentCount} estourado{overspentCount > 1 ? 's' : ''}
                </span>
              </>
            ) : null}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
