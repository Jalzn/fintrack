import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Subcategory } from '@/types/api';
import { useSubcategoriesQuery } from '../hooks/use-subcategories-query';
import { DeleteSubcategoryAlert } from './DeleteSubcategoryAlert';
import { SubcategoryFormDialog } from './SubcategoryFormDialog';

interface SubcategoryListProps {
  categoryId: string;
}

export function SubcategoryList({ categoryId }: SubcategoryListProps) {
  const { data, isLoading, isError } = useSubcategoriesQuery({ categoryId });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [deleting, setDeleting] = useState<Subcategory | null>(null);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Subcategorias</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setCreating(true)}
          className="gap-1"
        >
          <Plus aria-hidden className="size-4" />
          Adicionar
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar as subcategorias.</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma subcategoria ainda.</p>
      ) : (
        <ul className="space-y-1">
          {data.map((sub) => (
            <li
              key={sub.id}
              className="flex items-center justify-between rounded-md bg-background px-3 py-2"
            >
              <span className="text-sm">{sub.name}</span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing(sub)}
                  aria-label={`Editar ${sub.name}`}
                >
                  <Pencil aria-hidden className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleting(sub)}
                  aria-label={`Excluir ${sub.name}`}
                >
                  <Trash2 aria-hidden className="size-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <SubcategoryFormDialog open={creating} onOpenChange={setCreating} categoryId={categoryId} />
      <SubcategoryFormDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        categoryId={categoryId}
        {...(editing !== null && { initial: editing })}
      />
      <DeleteSubcategoryAlert
        subcategory={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </div>
  );
}
