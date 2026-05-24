import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AmountInput } from '@/components/AmountInput';
import { DatePicker } from '@/components/DatePicker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
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
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { dateToApiDateOnly, parseDateOnly } from '@/lib/date';
import { formatMoney } from '@/lib/money';
import type { GroceryUnit, MoneySnapshot } from '@/types/api';
import { useReceiptQuery } from '../hooks/use-receipt-query';
import { useUpdateReceiptMutation } from '../hooks/use-update-receipt';
import { type ReceiptEditFormInput, receiptEditFormSchema } from '../schemas/receipt-edit-schema';
import { departmentLabel, GROCERY_DEPARTMENTS } from './department-labels';

const NONE = '__none__';

const UNIT_OPTIONS: { value: GroceryUnit; label: string }[] = [
  { value: 'un', label: 'un' },
  { value: 'kg', label: 'kg' },
  { value: 'L', label: 'L' },
];

const DEPARTMENT_OPTIONS = [
  { value: NONE, label: 'Sem departamento' },
  ...GROCERY_DEPARTMENTS.map((slug) => ({ value: slug, label: departmentLabel(slug) })),
];

interface ReceiptEditDialogProps {
  receiptId: string | null;
  onOpenChange: (open: boolean) => void;
}

function lineMinorUnits(quantity: number, unitPrice: number): number {
  return Math.round((quantity || 0) * (unitPrice || 0));
}

export function ReceiptEditDialog({ receiptId, onOpenChange }: ReceiptEditDialogProps) {
  const { data, isLoading } = useReceiptQuery(receiptId);
  const mutation = useUpdateReceiptMutation();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReceiptEditFormInput>({
    resolver: zodResolver(receiptEditFormSchema),
    defaultValues: { storeName: '', purchaseDate: new Date(), totalMinorUnits: 0, items: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  // Populate the form once per opened receipt; avoid clobbering edits on a background refetch.
  const loadedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!data || loadedIdRef.current === data.id) return;
    loadedIdRef.current = data.id;
    reset({
      storeName: data.storeName,
      purchaseDate: parseDateOnly(data.purchaseDate),
      totalMinorUnits: data.total.amount,
      items: data.items.map((item) => ({
        id: item.id,
        normalizedName: item.normalizedName,
        quantity: item.quantity,
        unit: item.unit,
        unitPriceMinorUnits: item.unitPrice.amount,
        department: item.department,
        brand: item.brand,
        size: item.size,
        code: item.code,
      })),
    });
  }, [data, reset]);
  useEffect(() => {
    if (receiptId === null) loadedIdRef.current = null;
  }, [receiptId]);

  const currency = data?.total.currency;
  const watchedItems = watch('items');
  const itemsSum = watchedItems.reduce(
    (acc, item) => acc + lineMinorUnits(item.quantity, item.unitPriceMinorUnits),
    0,
  );
  const money = (amount: number): string =>
    currency ? formatMoney({ amount, currency } satisfies MoneySnapshot) : '';

  const onSubmit = handleSubmit(async (values) => {
    if (!receiptId) return;
    try {
      await mutation.mutateAsync({
        id: receiptId,
        payload: {
          storeName: values.storeName,
          purchaseDate: dateToApiDateOnly(values.purchaseDate),
          totalMinorUnits: values.totalMinorUnits,
          items: values.items.map((item) => ({
            ...(item.id ? { id: item.id } : {}),
            normalizedName: item.normalizedName,
            quantity: item.quantity,
            unit: item.unit,
            unitPriceMinorUnits: item.unitPriceMinorUnits,
            department: item.department,
            brand: item.brand,
            size: item.size,
            code: item.code,
          })),
        },
      });
      toast.success('Nota atualizada');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Erro ao salvar a nota');
    }
  });

  return (
    <Dialog open={receiptId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar nota</DialogTitle>
          <DialogDescription>
            Corrija o que a IA leu errado. A data e o valor da transação vinculada são atualizados
            junto.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="receipt-store">Mercado</Label>
                <Input
                  id="receipt-store"
                  aria-invalid={errors.storeName !== undefined}
                  {...register('storeName')}
                />
                {errors.storeName !== undefined ? (
                  <p className="text-destructive text-sm">{errors.storeName.message}</p>
                ) : null}
              </div>

              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="receipt-date">Data</Label>
                <Controller
                  control={control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <DatePicker
                      id="receipt-date"
                      value={field.value}
                      onChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                      aria-invalid={errors.purchaseDate !== undefined}
                    />
                  )}
                />
                {errors.purchaseDate !== undefined ? (
                  <p className="text-destructive text-sm">{errors.purchaseDate.message}</p>
                ) : null}
              </div>

              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="receipt-total">Total</Label>
                <Controller
                  control={control}
                  name="totalMinorUnits"
                  render={({ field }) => (
                    <AmountInput
                      id="receipt-total"
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={errors.totalMinorUnits !== undefined}
                    />
                  )}
                />
                {errors.totalMinorUnits !== undefined ? (
                  <p className="text-destructive text-sm">{errors.totalMinorUnits.message}</p>
                ) : (
                  <p className="text-muted-foreground text-xs">Soma dos itens: {money(itemsSum)}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Itens</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      normalizedName: '',
                      quantity: 1,
                      unit: 'un',
                      unitPriceMinorUnits: 0,
                      department: null,
                      brand: null,
                      size: null,
                      code: null,
                    })
                  }
                >
                  <Plus className="size-4" /> Adicionar item
                </Button>
              </div>
              {errors.items?.message !== undefined ? (
                <p className="text-destructive text-sm">{errors.items.message}</p>
              ) : null}

              <div className="space-y-3">
                {fields.map((row, index) => {
                  const itemErrors = errors.items?.[index];
                  const watched = watchedItems[index];
                  const line = watched
                    ? lineMinorUnits(watched.quantity, watched.unitPriceMinorUnits)
                    : 0;
                  return (
                    <div key={row.id} className="space-y-3 rounded-lg border p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-1">
                          <Input
                            aria-label="Nome do item"
                            placeholder="Nome do item"
                            aria-invalid={itemErrors?.normalizedName !== undefined}
                            {...register(`items.${index}.normalizedName`)}
                          />
                          {itemErrors?.normalizedName !== undefined ? (
                            <p className="text-destructive text-xs">
                              {itemErrors.normalizedName.message}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remover item"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">Departamento</Label>
                          <Controller
                            control={control}
                            name={`items.${index}.department`}
                            render={({ field }) => (
                              <Select
                                value={field.value ?? NONE}
                                onValueChange={(value) =>
                                  field.onChange(value === NONE ? null : value)
                                }
                                items={DEPARTMENT_OPTIONS}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DEPARTMENT_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">Qtd</Label>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            aria-label="Quantidade"
                            aria-invalid={itemErrors?.quantity !== undefined}
                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">Unidade</Label>
                          <Controller
                            control={control}
                            name={`items.${index}.unit`}
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                items={UNIT_OPTIONS}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {UNIT_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">Preço unit.</Label>
                          <Controller
                            control={control}
                            name={`items.${index}.unitPriceMinorUnits`}
                            render={({ field }) => (
                              <AmountInput value={field.value} onChange={field.onChange} />
                            )}
                          />
                        </div>
                      </div>

                      <p className="text-muted-foreground text-xs">Total do item: {money(line)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Salvando
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
