import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { usePeriod } from '@/hooks/use-period';
import type { Transaction, TransactionType } from '@/types/api';
import type { TransactionListFilters } from '../api/keys';
import { DeleteTransactionAlert } from '../components/DeleteTransactionAlert';
import { Pagination } from '../components/Pagination';
import { TransactionFilters, type TypeFilter } from '../components/TransactionFilters';
import { TransactionFormDialog } from '../components/TransactionFormDialog';
import { TransactionsSummary } from '../components/TransactionsSummary';
import { TransactionTable } from '../components/TransactionTable';
import { useTransactionsQuery } from '../hooks/use-transactions-query';

const PAGE_LIMIT = 20;

function isType(value: string | null): value is TypeFilter {
  return value === 'all' || value === 'INCOME' || value === 'EXPENSE';
}

export function TransactionsPage() {
  const [params, setParams] = useSearchParams();
  const { range } = usePeriod();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const typeParam = params.get('type');
  const type: TypeFilter = isType(typeParam) ? typeParam : 'all';
  const categoryId = params.get('categoryId');
  const subcategoryId = params.get('subcategoryId');
  const pageParam = Number.parseInt(params.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const baseFilters = useMemo<Omit<TransactionListFilters, 'page' | 'limit'>>(() => {
    const result: Omit<TransactionListFilters, 'page' | 'limit'> = {
      startDate: range.startDate,
      endDate: range.endDate,
    };
    if (type !== 'all') result.type = type as TransactionType;
    if (categoryId) result.categoryId = categoryId;
    if (subcategoryId) result.subcategoryId = subcategoryId;
    return result;
  }, [type, categoryId, subcategoryId, range.startDate, range.endDate]);

  const filters = useMemo<TransactionListFilters>(
    () => ({ ...baseFilters, page, limit: PAGE_LIMIT }),
    [baseFilters, page],
  );

  const { data, isLoading, isError } = useTransactionsQuery(filters);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    next.delete('page');
    setParams(next, { replace: false });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Transações</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe e gerencie suas receitas e despesas.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus aria-hidden className="size-4" />
          Nova transação
        </Button>
      </header>

      <TransactionFilters
        type={type}
        onTypeChange={(value) => updateParams({ type: value === 'all' ? null : value })}
        categoryId={categoryId}
        onCategoryChange={(id) => updateParams({ categoryId: id, subcategoryId: null })}
        subcategoryId={subcategoryId}
        onSubcategoryChange={(id) => updateParams({ subcategoryId: id })}
      />

      <TransactionsSummary filters={baseFilters} />

      <TransactionTable
        transactions={data?.data}
        isLoading={isLoading}
        isError={isError}
        onEdit={setEditing}
        onDelete={setDeleting}
      />

      {data ? (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={(p) => {
            const next = new URLSearchParams(params);
            next.set('page', String(p));
            setParams(next, { replace: false });
          }}
        />
      ) : null}

      <TransactionFormDialog open={creating} onOpenChange={setCreating} />
      <TransactionFormDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        {...(editing !== null && { initial: editing })}
      />
      <DeleteTransactionAlert
        transaction={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </div>
  );
}
