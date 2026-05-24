import { CategoryCombobox } from '@/components/CategoryCombobox';
import { SubcategoryCombobox } from '@/components/SubcategoryCombobox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TransactionType } from '@/types/api';

export type TypeFilter = 'all' | TransactionType;

interface TransactionFiltersProps {
  type: TypeFilter;
  onTypeChange: (type: TypeFilter) => void;
  categoryId: string | null;
  onCategoryChange: (id: string | null) => void;
  subcategoryId: string | null;
  onSubcategoryChange: (id: string | null) => void;
}

export function TransactionFilters({
  type,
  onTypeChange,
  categoryId,
  onCategoryChange,
  subcategoryId,
  onSubcategoryChange,
}: TransactionFiltersProps) {
  const comboboxType = type === 'all' ? undefined : type;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
      <div>
        <Tabs value={type} onValueChange={(value) => onTypeChange(value as TypeFilter)}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="EXPENSE">Despesas</TabsTrigger>
            <TabsTrigger value="INCOME">Receitas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-1 lg:justify-end">
        <div className="min-w-[200px]">
          <CategoryCombobox
            value={categoryId ?? ''}
            type={comboboxType}
            onChange={(id) => onCategoryChange(id || null)}
            placeholder="Filtrar por categoria"
          />
        </div>
        <div className="min-w-[200px]">
          <SubcategoryCombobox
            value={subcategoryId}
            categoryId={categoryId ?? ''}
            onChange={onSubcategoryChange}
            disabled={!categoryId}
          />
        </div>
      </div>
    </div>
  );
}
