import { Check } from 'lucide-react';
import { useId } from 'react';
import { CATEGORY_COLORS } from '@/lib/category-colors';
import { cn } from '@/lib/utils';

interface ColorSwatchInputProps {
  value: string;
  onChange: (hex: string) => void;
  id?: string;
  label?: string;
}

export function ColorSwatchInput({ value, onChange, id, label = 'Cor' }: ColorSwatchInputProps) {
  const groupName = useId();
  return (
    <fieldset id={id} className="flex flex-wrap gap-2 border-0 p-0">
      <legend className="sr-only">{label}</legend>
      {CATEGORY_COLORS.map((color) => {
        const isSelected = color.hex.toLowerCase() === value.toLowerCase();
        return (
          <label
            key={color.key}
            className={cn(
              'relative flex size-8 cursor-pointer items-center justify-center rounded-full transition',
              color.bgClass,
              'ring-offset-background has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2',
              isSelected && 'ring-2 ring-ring ring-offset-2',
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={color.hex}
              checked={isSelected}
              onChange={() => onChange(color.hex)}
              className="sr-only"
              aria-label={color.label}
            />
            {isSelected ? <Check aria-hidden className="size-4 text-white" /> : null}
          </label>
        );
      })}
    </fieldset>
  );
}
