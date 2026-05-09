import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SubcategoryList } from '@/features/subcategories/components/SubcategoryList';
import { colorFromHex } from '@/lib/category-colors';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/api';

interface CategoryListProps {
  categories: Category[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryList({
  categories,
  isLoading,
  isError,
  onEdit,
  onDelete,
}: CategoryListProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Não foi possível carregar as categorias.</p>;
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma categoria criada ainda. Clique em "Nova categoria" para começar.
        </p>
      </div>
    );
  }

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <ul className="space-y-2">
      {categories.map((category) => {
        const color = colorFromHex(category.color);
        const isOpen = expanded[category.id] ?? false;
        return (
          <li key={category.id} className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between gap-3 p-4">
              <button
                type="button"
                onClick={() => toggle(category.id)}
                className="flex flex-1 items-center gap-3 text-left"
                aria-expanded={isOpen}
                aria-label={`${isOpen ? 'Recolher' : 'Expandir'} subcategorias de ${category.name}`}
              >
                {isOpen ? (
                  <ChevronDown aria-hidden className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
                )}
                <span className={cn('size-3 rounded-full', color.bgClass)} aria-hidden />
                <span className="font-medium">{category.name}</span>
                <Badge
                  variant={category.type === 'INCOME' ? 'secondary' : 'outline'}
                  className={cn(category.type === 'INCOME' ? 'text-income' : 'text-expense')}
                >
                  {category.type === 'INCOME' ? 'Receita' : 'Despesa'}
                </Badge>
              </button>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(category)}
                  aria-label={`Editar ${category.name}`}
                >
                  <Pencil aria-hidden className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(category)}
                  aria-label={`Excluir ${category.name}`}
                >
                  <Trash2 aria-hidden className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
            {isOpen ? (
              <div className="border-t border-border p-4">
                <SubcategoryList categoryId={category.id} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
