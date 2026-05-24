import { currentPeriod } from '@/lib/period';

export type InsightTone = 'neutral' | 'warning' | 'positive';
export type InsightIcon = 'category' | 'budget' | 'pace' | 'trend';

export interface Insight {
  id: string;
  tone: InsightTone;
  icon: InsightIcon;
  text: string;
}

export interface NamedValue {
  name: string;
  value: number;
}

export interface NamedBudget {
  name: string;
  percentSpent: number;
}

export interface BuildInsightsArgs {
  period: string;
  now?: Date;
  /** Current-month expense total, in currency units. */
  expenseTotal: number;
  /** Current-month expenses by category, sorted desc by value. */
  categoriesNow: NamedValue[];
  /** Previous-month expenses by category. */
  categoriesPrev: NamedValue[];
  budgets: NamedBudget[];
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const MIN_VARIATION_PCT = 20;
const BUDGET_WARN_PCT = 80;

/**
 * Pure, rule-based insights for the dashboard. No IA, no fetching. Each rule has a
 * minimum-data guard so it disappears instead of lying. Returns at most 4 insights.
 */
export function buildInsights(args: BuildInsightsArgs): Insight[] {
  const { period, now = new Date(), expenseTotal, categoriesNow, categoriesPrev, budgets } = args;
  const insights: Insight[] = [];

  // 1. Most critical budget.
  const worstBudget = [...budgets].sort((a, b) => b.percentSpent - a.percentSpent)[0];
  if (worstBudget && worstBudget.percentSpent >= BUDGET_WARN_PCT) {
    insights.push({
      id: 'critical-budget',
      tone: 'warning',
      icon: 'budget',
      text:
        worstBudget.percentSpent >= 100
          ? `${worstBudget.name} estourou o orçamento (${worstBudget.percentSpent}%).`
          : `${worstBudget.name} já usou ${worstBudget.percentSpent}% do orçamento.`,
    });
  }

  // 2. Biggest variation vs the previous month.
  const prevByName = new Map(categoriesPrev.map((c) => [c.name, c.value]));
  let biggest: { name: string; pct: number } | undefined;
  for (const c of categoriesNow) {
    const prev = prevByName.get(c.name);
    if (prev === undefined || prev <= 0) continue;
    const pct = Math.round(((c.value - prev) / prev) * 100);
    if (Math.abs(pct) < MIN_VARIATION_PCT) continue;
    if (!biggest || Math.abs(pct) > Math.abs(biggest.pct)) {
      biggest = { name: c.name, pct };
    }
  }
  if (biggest) {
    insights.push({
      id: 'variation',
      tone: biggest.pct > 0 ? 'warning' : 'positive',
      icon: 'trend',
      text:
        biggest.pct > 0
          ? `${biggest.name} subiu ${biggest.pct}% vs o mês anterior.`
          : `${biggest.name} caiu ${Math.abs(biggest.pct)}% vs o mês anterior.`,
    });
  }

  // 3. Spending pace — only for the in-progress current month.
  if (period === currentPeriod() && expenseTotal > 0) {
    const [yStr, mStr] = period.split('-');
    const daysInMonth = new Date(Number(yStr), Number(mStr), 0).getDate();
    const dayOfMonth = now.getDate();
    if (dayOfMonth >= 3 && dayOfMonth < daysInMonth) {
      const projected = (expenseTotal / dayOfMonth) * daysInMonth;
      insights.push({
        id: 'pace',
        tone: 'neutral',
        icon: 'pace',
        text: `No ritmo atual, as despesas devem fechar em ~${currency.format(projected)}.`,
      });
    }
  }

  // 4. Top category.
  const top = categoriesNow[0];
  if (top && expenseTotal > 0) {
    const pct = Math.round((top.value / expenseTotal) * 100);
    insights.push({
      id: 'top-category',
      tone: 'neutral',
      icon: 'category',
      text: `${top.name} concentra ${pct}% das despesas do mês.`,
    });
  }

  return insights.slice(0, 4);
}
