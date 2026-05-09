import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSubcategoriesQuery } from '@/features/subcategories/hooks/use-subcategories-query';
import { cn } from '@/lib/utils';

interface SubcategoryComboboxProps {
  id?: string;
  value: string | null;
  categoryId: string;
  onChange: (subcategoryId: string | null) => void;
  disabled?: boolean;
  'aria-invalid'?: boolean;
}

export function SubcategoryCombobox({
  id,
  value,
  categoryId,
  onChange,
  disabled,
  ...rest
}: SubcategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const { data: subcategories } = useSubcategoriesQuery({
    categoryId,
    enabled: !disabled && categoryId !== '',
  });

  const selected = subcategories?.find((s) => s.id === value);
  const placeholder = disabled ? 'Selecione uma categoria primeiro' : 'Sem subcategoria';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            id={id}
            className="w-full justify-between"
            disabled={disabled}
            aria-invalid={rest['aria-invalid']}
          />
        }
      >
        {selected ? (
          <span>{selected.name}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown aria-hidden className="size-4 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Buscar subcategoria..." />
          <CommandList>
            <CommandEmpty>Nenhuma subcategoria encontrada.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check
                  aria-hidden
                  className={cn('size-4', value === null ? 'opacity-100' : 'opacity-0')}
                />
                <span className="text-muted-foreground">Sem subcategoria</span>
              </CommandItem>
              {subcategories?.map((sub) => (
                <CommandItem
                  key={sub.id}
                  value={`${sub.name} ${sub.id}`}
                  onSelect={() => {
                    onChange(sub.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    aria-hidden
                    className={cn('size-4', value === sub.id ? 'opacity-100' : 'opacity-0')}
                  />
                  {sub.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
