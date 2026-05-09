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
import type { Transaction } from '@/types/api';
import { useDeleteTransactionMutation } from '../hooks/use-delete-transaction';

interface DeleteTransactionAlertProps {
  transaction: Transaction | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTransactionAlert({ transaction, onOpenChange }: DeleteTransactionAlertProps) {
  const mutation = useDeleteTransactionMutation();
  const open = transaction !== null;

  const handleConfirm = async () => {
    if (!transaction) return;
    try {
      await mutation.mutateAsync(transaction.id);
      toast.success('Transação excluída');
    } catch {
      toast.error('Erro ao excluir transação');
    } finally {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
          <AlertDialogDescription>
            {transaction
              ? `A transação "${transaction.description}" será excluída permanentemente.`
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
