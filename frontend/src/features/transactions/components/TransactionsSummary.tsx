import { StatCard } from '@/components/StatCard';
import type { TransactionListFilters } from '../api/keys';
import { useTransactionsSummary } from '../hooks/use-transactions-summary';

interface TransactionsSummaryProps {
  filters: Omit<TransactionListFilters, 'page' | 'limit'>;
}

export function TransactionsSummary({ filters }: TransactionsSummaryProps) {
  const summary = useTransactionsSummary(filters);

  return (
    <div className="space-y-2">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Receitas"
          value={summary.income}
          accent="income"
          isLoading={summary.isLoading}
        />
        <StatCard
          label="Despesas"
          value={summary.expense}
          accent="expense"
          isLoading={summary.isLoading}
        />
        <StatCard
          label="Saldo"
          value={summary.balance}
          accent="balance"
          isLoading={summary.isLoading}
        />
      </div>
      {!summary.isLoading ? (
        <p className="text-muted-foreground text-xs">
          {summary.count} {summary.count === 1 ? 'transação' : 'transações'} no período
          {summary.partial ? ' · somando as 100 mais recentes' : ''}
        </p>
      ) : null}
    </div>
  );
}
