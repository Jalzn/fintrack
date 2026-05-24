import { BudgetSnapshot } from '../components/BudgetSnapshot';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { EvolutionCard } from '../components/EvolutionCard';
import { GreetingHeader } from '../components/GreetingHeader';
import { InsightStrip } from '../components/InsightStrip';
import { RecentTransactions } from '../components/RecentTransactions';
import { SummaryCards } from '../components/SummaryCards';

export function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <GreetingHeader />
      <SummaryCards />
      <InsightStrip />
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <EvolutionCard />
        <CategoryBreakdown />
      </div>
      <BudgetSnapshot />
      <RecentTransactions />
    </div>
  );
}
