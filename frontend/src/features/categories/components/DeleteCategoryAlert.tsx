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
import type { Category } from '@/types/api';
import { useDeleteCategoryMutation } from '../hooks/use-delete-category';

interface DeleteCategoryAlertProps {
  category: Category | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCategoryAlert({ category, onOpenChange }: DeleteCategoryAlertProps) {
  const mutation = useDeleteCategoryMutation();
  const open = category !== null;

  const handleConfirm = async () => {
    if (!category) return;
    try {
      await mutation.mutateAsync(category.id);
      toast.success('Categoria excluída');
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        if (error.code === 'CATEGORY_HAS_SUBCATEGORIES') {
          toast.error('Esta categoria possui subcategorias. Remova-as antes de excluir.');
        } else if (error.code === 'CATEGORY_IN_USE') {
          toast.error('Esta categoria está em uso por transações.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Erro ao excluir categoria');
      }
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
          <AlertDialogDescription>
            {category ? `A categoria "${category.name}" será excluída permanentemente.` : ''}
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
