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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/api-client';
import type { Transaction, TransactionType } from '@/types/api';
import { useCreateTransactionMutation } from '../hooks/use-create-transaction';
import { useUpdateTransactionMutation } from '../hooks/use-update-transaction';
import { type TransactionFormInput, transactionFormSchema } from '../schemas/transaction-schemas';
import { AmountInput } from './AmountInput';
import { CategoryCombobox } from './CategoryCombobox';
import { DatePicker } from './DatePicker';
import { SubcategoryCombobox } from './SubcategoryCombobox';

const TYPE_OPTIONS = [
  { value: 'EXPENSE', label: 'Despesa' },
  { value: 'INCOME', label: 'Receita' },
];

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Transaction;
}

export function TransactionFormDialog({ open, onOpenChange, initial }: TransactionFormDialogProps) {
  const isEditing = initial !== undefined;
  const createMutation = useCreateTransactionMutation();
  const updateMutation = useUpdateTransactionMutation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormInput>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      description: '',
      amountMinorUnits: 0,
      currencyCode: 'BRL',
      type: 'EXPENSE',
      categoryId: '',
      subcategoryId: null,
      date: new Date(),
    },
  });

  useEffect(() => {
    if (!open) return;
    if (initial) {
      reset({
        description: initial.description,
        amountMinorUnits: initial.amount.amount,
        currencyCode: initial.amount.currency.code as 'BRL' | 'USD',
        type: initial.type,
        categoryId: initial.categoryId,
        subcategoryId: initial.subcategoryId,
        date: new Date(initial.date),
      });
    } else {
      reset({
        description: '',
        amountMinorUnits: 0,
        currencyCode: 'BRL',
        type: 'EXPENSE',
        categoryId: '',
        subcategoryId: null,
        date: new Date(),
      });
    }
  }, [open, initial, reset]);

  const type = watch('type');
  const categoryId = watch('categoryId');
  const subcategoryId = watch('subcategoryId');
  const amount = watch('amountMinorUnits');
  const date = watch('date');

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = handleSubmit(async (values) => {
    try {
      const isoDate = values.date.toISOString();
      if (isEditing && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          payload: {
            amountMinorUnits: values.amountMinorUnits,
            categoryId: values.categoryId,
            subcategoryId: values.subcategoryId,
            description: values.description,
            date: isoDate,
          },
        });
        toast.success('Transação atualizada');
      } else {
        await createMutation.mutateAsync({
          amountMinorUnits: values.amountMinorUnits,
          currencyCode: values.currencyCode,
          type: values.type,
          categoryId: values.categoryId,
          subcategoryId: values.subcategoryId,
          description: values.description,
          date: isoDate,
        });
        toast.success('Transação criada');
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'SUBCATEGORY_CATEGORY_MISMATCH') {
          toast.error('A subcategoria não pertence à categoria selecionada.');
        } else if (error.code === 'INVALID_CATEGORY_REFERENCE') {
          toast.error('Categoria inválida.');
        } else if (error.code === 'INVALID_SUBCATEGORY_REFERENCE') {
          toast.error('Subcategoria inválida.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Erro ao salvar transação');
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar transação' : 'Nova transação'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os detalhes da transação.'
              : 'Registre uma nova receita ou despesa.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {!isEditing ? (
            <div className="space-y-2">
              <Label htmlFor="transaction-type">Tipo</Label>
              <Select
                value={type}
                onValueChange={(value) => {
                  setValue('type', value as TransactionType);
                  setValue('categoryId', '');
                  setValue('subcategoryId', null);
                }}
                items={TYPE_OPTIONS}
              >
                <SelectTrigger id="transaction-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Despesa</SelectItem>
                  <SelectItem value="INCOME">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="transaction-amount">Valor</Label>
            <AmountInput
              id="transaction-amount"
              value={amount}
              onChange={(minor) => setValue('amountMinorUnits', minor, { shouldValidate: true })}
              aria-invalid={errors.amountMinorUnits !== undefined}
              autoFocus
            />
            {errors.amountMinorUnits !== undefined ? (
              <p className="text-destructive text-sm">{errors.amountMinorUnits.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-description">Descrição</Label>
            <Input
              id="transaction-description"
              placeholder="Compras no supermercado"
              aria-invalid={errors.description !== undefined}
              {...register('description')}
            />
            {errors.description !== undefined ? (
              <p className="text-destructive text-sm">{errors.description.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-category">Categoria</Label>
            <CategoryCombobox
              id="transaction-category"
              value={categoryId}
              type={type}
              onChange={(id) => {
                setValue('categoryId', id, { shouldValidate: true });
                setValue('subcategoryId', null);
              }}
              aria-invalid={errors.categoryId !== undefined}
            />
            {errors.categoryId !== undefined ? (
              <p className="text-destructive text-sm">{errors.categoryId.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-subcategory">Subcategoria (opcional)</Label>
            <SubcategoryCombobox
              id="transaction-subcategory"
              value={subcategoryId}
              categoryId={categoryId}
              onChange={(id) => setValue('subcategoryId', id)}
              disabled={!categoryId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-date">Data</Label>
            <DatePicker
              id="transaction-date"
              value={date}
              onChange={(value) => {
                if (value) setValue('date', value, { shouldValidate: true });
              }}
              aria-invalid={errors.date !== undefined}
            />
            {errors.date !== undefined ? (
              <p className="text-destructive text-sm">{errors.date.message}</p>
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
