import { Settings2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { GrocerySettingsForm } from './GrocerySettingsForm';

/** Header entry point for the grocery destination settings, tucked away in a side sheet. */
export function GrocerySettingsSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="outline" size="icon" aria-label="Destino das transações" />}
      >
        <Settings2 className="size-4" />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Destino das transações</SheetTitle>
          <SheetDescription>
            Escolha a categoria e a subcategoria onde as compras de mercado serão lançadas.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <GrocerySettingsForm onSaved={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
