import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useReceiptQuery } from '../hooks/use-receipt-query';
import { departmentLabel } from './department-labels';

interface ReceiptDetailDialogProps {
  receiptId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptDetailDialog({ receiptId, onOpenChange }: ReceiptDetailDialogProps) {
  const { data, isLoading } = useReceiptQuery(receiptId);

  return (
    <Dialog open={receiptId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{data ? data.storeName : 'Nota'}</DialogTitle>
          <DialogDescription>
            {data
              ? `${formatDateOnly(data.purchaseDate, 'dd/MM/yyyy')} · ${formatMoney(data.total)}`
              : 'Itens da nota'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((item) => {
                  const meta = [item.brand, item.size].filter(Boolean).join(' · ');
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span className="font-medium capitalize">{item.normalizedName}</span>
                          {item.department ? (
                            <Badge variant="secondary" className="font-normal">
                              {departmentLabel(item.department)}
                            </Badge>
                          ) : null}
                        </span>
                        <span
                          className="block text-muted-foreground text-xs"
                          title={item.code ?? ''}
                        >
                          {meta || item.rawDescription}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">{formatMoney(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatMoney(item.lineTotal)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
