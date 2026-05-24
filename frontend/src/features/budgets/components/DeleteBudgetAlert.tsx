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
import type { Budget } from '@/types/api';
import { useDeleteBudgetMutation } from '../hooks/use-delete-budget';

interface DeleteBudgetAlertProps {
  budget: Budget | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteBudgetAlert({ budget, onOpenChange }: DeleteBudgetAlertProps) {
  const mutation = useDeleteBudgetMutation();
  const open = budget !== null;

  const handleConfirm = async () => {
    if (!budget) return;
    try {
      await mutation.mutateAsync(budget.id);
      toast.success('Orçamento excluído');
      onOpenChange(false);
    } catch {
      toast.error('Erro ao excluir orçamento');
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
          <AlertDialogDescription>
            Este orçamento será excluído permanentemente.
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
