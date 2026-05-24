import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, X } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AmountInput } from '@/components/AmountInput';
import { CategoryCombobox } from '@/components/CategoryCombobox';
import { ColorSwatchInput } from '@/components/ColorSwatchInput';
import { SubcategoryCombobox } from '@/components/SubcategoryCombobox';
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
import { DEFAULT_CATEGORY_HEX } from '@/lib/category-colors';
import type { Budget } from '@/types/api';
import { useCreateBudgetMutation } from '../hooks/use-create-budget';
import { useUpdateBudgetMutation } from '../hooks/use-update-budget';
import { type BudgetFormInput, budgetFormSchema } from '../schemas/budget-schemas';

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Budget;
  defaultPeriod: string;
}

const emptyScope = { categoryId: '', subcategoryId: null };

function defaults(defaultPeriod: string): BudgetFormInput {
  return {
    name: '',
    color: DEFAULT_CATEGORY_HEX,
    scopes: [{ ...emptyScope }],
    period: defaultPeriod,
    plannedMinorUnits: 0,
    currencyCode: 'BRL',
  };
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  initial,
  defaultPeriod,
}: BudgetFormDialogProps) {
  const isEditing = initial !== undefined;
  const createMutation = useCreateBudgetMutation();
  const updateMutation = useUpdateBudgetMutation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<BudgetFormInput>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: defaults(defaultPeriod),
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'scopes' });

  useEffect(() => {
    if (!open) return;
    if (initial) {
      reset({
        name: initial.name,
        color: initial.color,
        scopes: initial.scopes.map((s) => ({
          categoryId: s.categoryId,
          subcategoryId: s.subcategoryId,
        })),
        period: initial.periodStart.slice(0, 7),
        plannedMinorUnits: initial.planned.amount,
        currencyCode: initial.planned.currency.code as 'BRL' | 'USD',
      });
    } else {
      reset(defaults(defaultPeriod));
    }
  }, [open, initial, defaultPeriod, reset]);

  const name = watch('name');
  const color = watch('color');
  const scopes = watch('scopes');
  const amount = watch('plannedMinorUnits');

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = handleSubmit(async (values) => {
    const scopesPayload = values.scopes.map((s) => ({
      categoryId: s.categoryId,
      subcategoryId: s.subcategoryId,
    }));
    try {
      if (isEditing && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          payload: {
            name: values.name,
            color: values.color,
            scopes: scopesPayload,
            plannedMinorUnits: values.plannedMinorUnits,
          },
        });
        toast.success('Orçamento atualizado');
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          color: values.color,
          scopes: scopesPayload,
          period: values.period,
          plannedMinorUnits: values.plannedMinorUnits,
          currencyCode: values.currencyCode,
        });
        toast.success('Orçamento criado');
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'BUDGET_CATEGORY_NOT_EXPENSE') {
          toast.error('Apenas categorias de despesa podem entrar no orçamento.');
        } else if (error.code === 'BUDGET_SUBCATEGORY_CATEGORY_MISMATCH') {
          toast.error('Uma subcategoria não pertence à categoria escolhida.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Erro ao salvar orçamento');
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar orçamento' : 'Novo orçamento'}</DialogTitle>
          <DialogDescription>
            Dê um nome, escolha uma cor e agrupe quantas categorias quiser neste orçamento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="budget-name">Nome</Label>
            <Input
              id="budget-name"
              value={name}
              onChange={(e) => setValue('name', e.target.value, { shouldValidate: true })}
              placeholder="Ex.: Gastos no trabalho"
              aria-invalid={errors.name !== undefined}
            />
            {errors.name !== undefined ? (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-color">Cor</Label>
            <ColorSwatchInput
              id="budget-color"
              value={color}
              onChange={(hex) => setValue('color', hex, { shouldValidate: true })}
            />
          </div>

          <div className="space-y-3">
            <Label>Categorias incluídas</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <CategoryCombobox
                    value={scopes?.[index]?.categoryId ?? ''}
                    type="EXPENSE"
                    onChange={(id) => {
                      setValue(`scopes.${index}.categoryId`, id, { shouldValidate: true });
                      setValue(`scopes.${index}.subcategoryId`, null);
                    }}
                    aria-invalid={errors.scopes?.[index]?.categoryId !== undefined}
                    placeholder="Categoria"
                  />
                  <SubcategoryCombobox
                    value={scopes?.[index]?.subcategoryId ?? null}
                    categoryId={scopes?.[index]?.categoryId ?? ''}
                    onChange={(id) => setValue(`scopes.${index}.subcategoryId`, id)}
                    disabled={!scopes?.[index]?.categoryId}
                  />
                  {errors.scopes?.[index]?.categoryId !== undefined ? (
                    <p className="text-destructive text-sm">
                      {errors.scopes[index]?.categoryId?.message}
                    </p>
                  ) : null}
                </div>
                {fields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remover categoria"
                    onClick={() => remove(index)}
                  >
                    <X className="size-4" />
                  </Button>
                ) : null}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => append({ ...emptyScope })}
            >
              <Plus aria-hidden className="size-4" />
              Adicionar categoria
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-period">Mês</Label>
            <Input
              id="budget-period"
              type="month"
              aria-invalid={errors.period !== undefined}
              disabled={isEditing}
              {...register('period')}
            />
            {errors.period !== undefined ? (
              <p className="text-destructive text-sm">{errors.period.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-amount">Valor planejado</Label>
            <AmountInput
              id="budget-amount"
              value={amount}
              onChange={(minor) => setValue('plannedMinorUnits', minor, { shouldValidate: true })}
              aria-invalid={errors.plannedMinorUnits !== undefined}
            />
            {errors.plannedMinorUnits !== undefined ? (
              <p className="text-destructive text-sm">{errors.plannedMinorUnits.message}</p>
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
