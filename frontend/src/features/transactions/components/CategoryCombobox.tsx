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
import { useCategoriesQuery } from '@/features/categories/hooks/use-categories-query';
import { colorFromHex } from '@/lib/category-colors';
import { cn } from '@/lib/utils';
import type { TransactionType } from '@/types/api';

interface CategoryComboboxProps {
  id?: string;
  value: string;
  type: TransactionType | undefined;
  onChange: (categoryId: string) => void;
  'aria-invalid'?: boolean;
  placeholder?: string;
}

export function CategoryCombobox({
  id,
  value,
  type,
  onChange,
  placeholder = 'Selecione uma categoria',
  ...rest
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const queryOptions = type !== undefined ? { type } : {};
  const { data: categories } = useCategoriesQuery(queryOptions);

  const selected = categories?.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            id={id}
            className="w-full justify-between"
            aria-invalid={rest['aria-invalid']}
          />
        }
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <span
              className={cn('size-3 rounded-full', colorFromHex(selected.color).bgClass)}
              aria-hidden
            />
            {selected.name}
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown aria-hidden className="size-4 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Buscar categoria..." />
          <CommandList>
            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
            <CommandGroup>
              {categories?.map((category) => (
                <CommandItem
                  key={category.id}
                  value={`${category.name} ${category.id}`}
                  onSelect={() => {
                    onChange(category.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    aria-hidden
                    className={cn('size-4', value === category.id ? 'opacity-100' : 'opacity-0')}
                  />
                  <span
                    className={cn('size-3 rounded-full', colorFromHex(category.color).bgClass)}
                    aria-hidden
                  />
                  {category.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
