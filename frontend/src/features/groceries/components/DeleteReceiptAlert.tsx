import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { GroceryReceipt } from '@/types/api';
import { useDeleteReceiptMutation } from '../hooks/use-delete-receipt';

interface DeleteReceiptAlertProps {
  receipt: GroceryReceipt | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteReceiptAlert({ receipt, onOpenChange }: DeleteReceiptAlertProps) {
  const mutation = useDeleteReceiptMutation();
  const open = receipt !== null;

  const handleConfirm = async () => {
    if (!receipt) return;
    try {
      await mutation.mutateAsync(receipt.id);
      toast.success('Nota excluída');
    } catch {
      toast.error('Erro ao excluir nota');
    } finally {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir nota?</AlertDialogTitle>
          <AlertDialogDescription>
            {receipt
              ? `A nota "${receipt.storeName}" e a transação vinculada serão excluídas permanentemente.`
              : ''}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
