import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { currentPeriod, formatPeriod, nextPeriod, previousPeriod } from '@/lib/period';

interface PeriodSwitcherProps {
  /** YYYY-MM */
  period: string;
  onChange: (period: string) => void;
}

export function PeriodSwitcher({ period, onChange }: PeriodSwitcherProps) {
  return (
    <div className="flex items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Período anterior"
        onClick={() => onChange(previousPeriod(period))}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              className="min-w-36 justify-center font-medium capitalize"
            />
          }
        >
          {formatPeriod(period)}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="min-w-44">
          <DropdownMenuItem onClick={() => onChange(currentPeriod())}>Este mês</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange(previousPeriod(currentPeriod()))}>
            Mês passado
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Próximo período"
        onClick={() => onChange(nextPeriod(period))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
