import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
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
import { formatDateOnly } from '@/lib/date';
import { formatMoney } from '@/lib/money';
import type { GroceryReceipt } from '@/types/api';

const SKELETON_ROWS = ['s1', 's2', 's3', 's4', 's5'];

interface ReceiptListProps {
  receipts: GroceryReceipt[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onView: (id: string) => void;
  onEdit: (receipt: GroceryReceipt) => void;
  onDelete: (receipt: GroceryReceipt) => void;
}

export function ReceiptList({
  receipts,
  isLoading,
  isError,
  onView,
  onEdit,
  onDelete,
}: ReceiptListProps) {
  if (isError) {
    return <p className="text-sm text-destructive">Erro ao carregar as notas.</p>;
  }

  let body: ReactNode;
  if (isLoading) {
    body = SKELETON_ROWS.map((id) => (
      <TableRow key={id}>
        <TableCell colSpan={4}>
          <Skeleton className="h-6 w-full" />
        </TableCell>
      </TableRow>
    ));
  } else if (!receipts || receipts.length === 0) {
    body = (
      <TableRow>
        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
          Nenhuma nota importada ainda.
        </TableCell>
      </TableRow>
    );
  } else {
    body = receipts.map((receipt) => (
      <TableRow key={receipt.id}>
        <TableCell className="font-medium">{receipt.storeName}</TableCell>
        <TableCell>{formatDateOnly(receipt.purchaseDate, 'dd/MM/yyyy')}</TableCell>
        <TableCell className="text-right font-medium text-expense">
          {formatMoney(receipt.total)}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ver itens"
              onClick={() => onView(receipt.id)}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Editar nota"
              onClick={() => onEdit(receipt)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Excluir nota"
              onClick={() => onDelete(receipt)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mercado</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-32 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{body}</TableBody>
      </Table>
    </div>
  );
}
