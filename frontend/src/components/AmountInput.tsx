import { forwardRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

interface AmountInputProps {
  id?: string;
  value: number;
  onChange: (minorUnits: number) => void;
  'aria-invalid'?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

function formatBRL(minorUnits: number): string {
  if (!Number.isFinite(minorUnits) || minorUnits <= 0) return '';
  const value = minorUnits / 100;
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseBRL(text: string): number {
  const digits = text.replace(/\D/g, '');
  if (digits.length === 0) return 0;
  return Number.parseInt(digits, 10);
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(function AmountInput(
  { id, value, onChange, placeholder = '0,00', autoFocus, ...rest },
  ref,
) {
  const [text, setText] = useState(formatBRL(value));

  useEffect(() => {
    setText(formatBRL(value));
  }, [value]);

  const handleChange = (raw: string) => {
    const minor = parseBRL(raw);
    setText(formatBRL(minor));
    onChange(minor);
  };

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground text-sm">
        R$
      </span>
      <Input
        ref={ref}
        id={id}
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-9"
        aria-invalid={rest['aria-invalid']}
      />
    </div>
  );
});
