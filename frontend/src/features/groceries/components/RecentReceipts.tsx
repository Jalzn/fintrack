import { useState } from 'react';
import { Link } from 'react-router';
import type { GroceryReceipt } from '@/types/api';
import { DeleteReceiptAlert } from './DeleteReceiptAlert';
import { ReceiptDetailDialog } from './ReceiptDetailDialog';
import { ReceiptList } from './ReceiptList';

interface RecentReceiptsProps {
  receipts: GroceryReceipt[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

/** Compact "latest purchases" block for the overview, linking to the full archive. */
export function RecentReceipts({ receipts, isLoading, isError }: RecentReceiptsProps) {
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<GroceryReceipt | null>(null);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-lg tracking-tight">Últimas compras</h2>
        <Link
          to="/mercado/notas"
          className="text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          Ver todas
        </Link>
      </div>
      <ReceiptList
        receipts={receipts}
        isLoading={isLoading}
        isError={isError}
        onView={setViewingId}
        onDelete={setDeleting}
      />
      <ReceiptDetailDialog
        receiptId={viewingId}
        onOpenChange={(open) => {
          if (!open) setViewingId(null);
        }}
      />
      <DeleteReceiptAlert
        receipt={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </section>
  );
}
