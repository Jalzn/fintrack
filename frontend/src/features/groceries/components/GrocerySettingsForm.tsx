import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CategoryCombobox } from '@/components/CategoryCombobox';
import { SubcategoryCombobox } from '@/components/SubcategoryCombobox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useGrocerySettingsQuery } from '../hooks/use-grocery-settings-query';
import { useUpdateGrocerySettingsMutation } from '../hooks/use-update-grocery-settings';

interface GrocerySettingsFormProps {
  onSaved?: () => void;
}

/** Destination category/subcategory where imported grocery purchases are booked. */
export function GrocerySettingsForm({ onSaved }: GrocerySettingsFormProps) {
  const { data: settings } = useGrocerySettingsQuery();
  const mutation = useUpdateGrocerySettingsMutation();

  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setCategoryId(settings.categoryId);
      setSubcategoryId(settings.subcategoryId);
    }
  }, [settings]);

  const handleSave = async () => {
    if (categoryId === '') {
      toast.error('Selecione uma categoria de destino.');
      return;
    }
    try {
      await mutation.mutateAsync({ categoryId, subcategoryId });
      toast.success('Destino salvo');
      onSaved?.();
    } catch {
      toast.error('Erro ao salvar o destino.');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="grocery-category">Categoria</Label>
        <CategoryCombobox
          id="grocery-category"
          type="EXPENSE"
          value={categoryId}
          onChange={(id) => {
            setCategoryId(id);
            setSubcategoryId(null);
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="grocery-subcategory">Subcategoria</Label>
        <SubcategoryCombobox
          id="grocery-subcategory"
          categoryId={categoryId}
          value={subcategoryId}
          onChange={setSubcategoryId}
          disabled={categoryId === ''}
        />
      </div>
      <Button onClick={handleSave} disabled={mutation.isPending} className="self-start">
        Salvar
      </Button>
    </div>
  );
}
