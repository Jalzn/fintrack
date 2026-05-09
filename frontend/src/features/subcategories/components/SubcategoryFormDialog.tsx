import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';
import type { Subcategory } from '@/types/api';
import { useCreateSubcategoryMutation } from '../hooks/use-create-subcategory';
import { useUpdateSubcategoryMutation } from '../hooks/use-update-subcategory';
import { type SubcategoryFormInput, subcategoryFormSchema } from '../schemas/subcategory-schemas';

interface SubcategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  initial?: Subcategory;
}

export function SubcategoryFormDialog({
  open,
  onOpenChange,
  categoryId,
  initial,
}: SubcategoryFormDialogProps) {
  const isEditing = initial !== undefined;
  const createMutation = useCreateSubcategoryMutation();
  const updateMutation = useUpdateSubcategoryMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubcategoryFormInput>({
    resolver: zodResolver(subcategoryFormSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (open) reset({ name: initial?.name ?? '' });
  }, [open, initial, reset]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEditing && initial) {
        await updateMutation.mutateAsync({ id: initial.id, payload: { name: values.name } });
        toast.success('Subcategoria atualizada');
      } else {
        await createMutation.mutateAsync({ categoryId, name: values.name });
        toast.success('Subcategoria criada');
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'SUBCATEGORY_NAME_ALREADY_EXISTS') {
        toast.error('Já existe uma subcategoria com esse nome.');
      } else {
        toast.error(error instanceof ApiError ? error.message : 'Erro ao salvar subcategoria');
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar subcategoria' : 'Nova subcategoria'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize o nome da subcategoria.'
              : 'Adicione uma subcategoria para detalhar transações.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="subcategory-name">Nome</Label>
            <Input
              id="subcategory-name"
              autoFocus
              placeholder="Supermercado"
              aria-invalid={errors.name !== undefined}
              {...register('name')}
            />
            {errors.name !== undefined ? (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
