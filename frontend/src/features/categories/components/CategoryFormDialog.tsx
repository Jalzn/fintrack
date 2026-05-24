import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ColorSwatchInput } from '@/components/ColorSwatchInput';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/api-client';
import { DEFAULT_CATEGORY_HEX } from '@/lib/category-colors';
import type { Category, TransactionType } from '@/types/api';
import { useCreateCategoryMutation } from '../hooks/use-create-category';
import { useUpdateCategoryMutation } from '../hooks/use-update-category';
import { type CategoryFormInput, categoryFormSchema } from '../schemas/category-schemas';

const TYPE_OPTIONS = [
  { value: 'EXPENSE', label: 'Despesa' },
  { value: 'INCOME', label: 'Receita' },
];

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Category;
}

export function CategoryFormDialog({ open, onOpenChange, initial }: CategoryFormDialogProps) {
  const isEditing = initial !== undefined;
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      color: DEFAULT_CATEGORY_HEX,
      type: 'EXPENSE' as TransactionType,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        color: initial?.color ?? DEFAULT_CATEGORY_HEX,
        type: initial?.type ?? 'EXPENSE',
      });
    }
  }, [open, initial, reset]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEditing && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          payload: { name: values.name, color: values.color },
        });
        toast.success('Categoria atualizada');
      } else {
        await createMutation.mutateAsync(values);
        toast.success('Categoria criada');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Erro ao salvar categoria');
    }
  });

  const colorValue = watch('color');
  const typeValue = watch('type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize o nome e a cor da categoria.'
              : 'Crie uma nova categoria para organizar suas transações.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="category-name">Nome</Label>
            <Input
              id="category-name"
              autoFocus
              placeholder="Alimentação"
              aria-invalid={errors.name !== undefined}
              {...register('name')}
            />
            {errors.name !== undefined ? (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            ) : null}
          </div>

          {!isEditing ? (
            <div className="space-y-2">
              <Label htmlFor="category-type">Tipo</Label>
              <Select
                value={typeValue}
                onValueChange={(value) => setValue('type', value as TransactionType)}
                items={TYPE_OPTIONS}
              >
                <SelectTrigger id="category-type" aria-invalid={errors.type !== undefined}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Despesa</SelectItem>
                  <SelectItem value="INCOME">Receita</SelectItem>
                </SelectContent>
              </Select>
              {errors.type !== undefined ? (
                <p className="text-destructive text-sm">{errors.type.message}</p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="category-color">Cor</Label>
            <ColorSwatchInput
              id="category-color"
              value={colorValue}
              onChange={(hex) => setValue('color', hex, { shouldValidate: true })}
            />
            {errors.color !== undefined ? (
              <p className="text-destructive text-sm">{errors.color.message}</p>
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
