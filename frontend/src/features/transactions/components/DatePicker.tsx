import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  id?: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  'aria-invalid'?: boolean;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Selecione a data',
  ...rest
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            id={id}
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
            )}
            aria-invalid={rest['aria-invalid']}
          />
        }
      >
        <CalendarIcon aria-hidden className="size-4" />
        {value ? format(value, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={value} onSelect={onChange} locale={ptBR} autoFocus />
      </PopoverContent>
    </Popover>
  );
}
