import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { GreetingHeader } from '../components/GreetingHeader';
import { RecentTransactions } from '../components/RecentTransactions';
import { SummaryCards } from '../components/SummaryCards';

export function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <GreetingHeader />
      <SummaryCards />
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <RecentTransactions />
        <CategoryBreakdown />
      </div>
    </div>
  );
}
