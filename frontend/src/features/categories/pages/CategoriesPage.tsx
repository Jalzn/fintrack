import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Category, TransactionType } from '@/types/api';
import { CategoryFormDialog } from '../components/CategoryFormDialog';
import { CategoryList } from '../components/CategoryList';
import { DeleteCategoryAlert } from '../components/DeleteCategoryAlert';
import { useCategoriesQuery } from '../hooks/use-categories-query';

type Filter = 'all' | TransactionType;

export function CategoriesPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const queryOptions = filter === 'all' ? {} : { type: filter };
  const { data, isLoading, isError } = useCategoriesQuery(queryOptions);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Organize suas transações com categorias e subcategorias.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus aria-hidden className="size-4" />
          Nova categoria
        </Button>
      </header>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="EXPENSE">Despesas</TabsTrigger>
          <TabsTrigger value="INCOME">Receitas</TabsTrigger>
        </TabsList>
      </Tabs>

      <CategoryList
        categories={data}
        isLoading={isLoading}
        isError={isError}
        onEdit={setEditing}
        onDelete={setDeleting}
      />

      <CategoryFormDialog open={creating} onOpenChange={setCreating} />
      <CategoryFormDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        {...(editing !== null && { initial: editing })}
      />
      <DeleteCategoryAlert
        category={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </div>
  );
}
