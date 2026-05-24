import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePeriod } from '@/hooks/use-period';
import type { GroceryReceipt } from '@/types/api';
import { DeleteReceiptAlert } from '../components/DeleteReceiptAlert';
import { ReceiptDetailDialog } from '../components/ReceiptDetailDialog';
import { ReceiptEditDialog } from '../components/ReceiptEditDialog';
import { ReceiptList } from '../components/ReceiptList';
import { useReceiptsQuery } from '../hooks/use-receipts-query';

const PAGE_LIMIT = 20;

/** `/mercado/notas` — arquivo de recibos do período selecionado. */
export function ReceiptsPage() {
  const { period, range } = usePeriod();
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<GroceryReceipt | null>(null);

  // Reset to the first page whenever the global period changes (adjust-during-render pattern).
  const [trackedPeriod, setTrackedPeriod] = useState(period);
  if (period !== trackedPeriod) {
    setTrackedPeriod(period);
    setPage(1);
  }

  const { data, isLoading, isError } = useReceiptsQuery({
    page,
    limit: PAGE_LIMIT,
    startDate: range.startDate,
    endDate: range.endDate,
  });

  return (
    <div className="space-y-4">
      <ReceiptList
        receipts={data?.data}
        isLoading={isLoading}
        isError={isError}
        onView={setViewingId}
        onEdit={(receipt) => setEditingId(receipt.id)}
        onDelete={setDeleting}
      />
      {data && data.totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Anterior
          </Button>
          <span className="text-muted-foreground text-sm">
            Página {data.page} de {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Próxima
          </Button>
        </div>
      ) : null}

      <ReceiptDetailDialog
        receiptId={viewingId}
        onOpenChange={(open) => {
          if (!open) setViewingId(null);
        }}
      />
      <ReceiptEditDialog
        receiptId={editingId}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      />
      <DeleteReceiptAlert
        receipt={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </div>
  );
}
