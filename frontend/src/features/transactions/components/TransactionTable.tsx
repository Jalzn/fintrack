import { ptBR } from 'date-fns/locale';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCategoriesQuery } from '@/features/categories/hooks/use-categories-query';
import { useSubcategoriesQuery } from '@/features/subcategories/hooks/use-subcategories-query';
import { colorFromHex } from '@/lib/category-colors';
import { formatDateOnly } from '@/lib/date';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/types/api';

interface TransactionTableProps {
  transactions: Transaction[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function TransactionTable({
  transactions,
  isLoading,
  isError,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const { data: categories } = useCategoriesQuery();
  const { data: subcategories } = useSubcategoriesQuery();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Não foi possível carregar as transações.</p>;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma transação encontrada com os filtros atuais.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead aria-label="Ações" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const category = categories?.find((c) => c.id === tx.categoryId);
            const subcategory = tx.subcategoryId
              ? subcategories?.find((s) => s.id === tx.subcategoryId)
              : null;
            const color = colorFromHex(category?.color);
            return (
              <TableRow key={tx.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateOnly(tx.date, 'd MMM yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell className="font-medium">{tx.description}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={cn('size-2.5 rounded-full', color.bgClass)} aria-hidden />
                    <span>{category?.name ?? '—'}</span>
                    {subcategory ? (
                      <Badge variant="secondary" className="text-xs">
                        {subcategory.name}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-mono',
                    tx.type === 'INCOME' ? 'text-income' : 'text-expense',
                  )}
                >
                  {tx.type === 'INCOME' ? '+' : '−'} {formatMoney(tx.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(tx)}
                      aria-label="Editar transação"
                    >
                      <Pencil aria-hidden className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(tx)}
                      aria-label="Excluir transação"
                    >
                      <Trash2 aria-hidden className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
