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
import { ApiError } from '@/lib/api-client';
import type { Subcategory } from '@/types/api';
import { useDeleteSubcategoryMutation } from '../hooks/use-delete-subcategory';

interface DeleteSubcategoryAlertProps {
  subcategory: Subcategory | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSubcategoryAlert({ subcategory, onOpenChange }: DeleteSubcategoryAlertProps) {
  const mutation = useDeleteSubcategoryMutation();
  const open = subcategory !== null;

  const handleConfirm = async () => {
    if (!subcategory) return;
    try {
      await mutation.mutateAsync(subcategory.id);
      toast.success('Subcategoria excluída');
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error('Esta subcategoria está em uso por transações.');
      } else {
        toast.error('Erro ao excluir subcategoria');
      }
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir subcategoria?</AlertDialogTitle>
          <AlertDialogDescription>
            {subcategory
              ? `A subcategoria "${subcategory.name}" será excluída permanentemente.`
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
