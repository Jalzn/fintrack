import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { BudgetProgressBar } from '@/components/BudgetProgressBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCategoriesQuery } from '@/features/categories/hooks/use-categories-query';
import { useSubcategoriesQuery } from '@/features/subcategories/hooks/use-subcategories-query';
import { usePeriod } from '@/hooks/use-period';
import { colorFromHex } from '@/lib/category-colors';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { Budget, BudgetScope } from '@/types/api';

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const navigate = useNavigate();
  const { period } = usePeriod();
  const { data: categories } = useCategoriesQuery();
  const { data: subcategories } = useSubcategoriesQuery({});

  const color = colorFromHex(budget.color);
  const overspent = budget.percentSpent >= 100;

  const scopeLabel = (scope: BudgetScope): string => {
    const categoryName = categories?.find((c) => c.id === scope.categoryId)?.name ?? 'Categoria';
    if (!scope.subcategoryId) return categoryName;
    const subName = subcategories?.find((s) => s.id === scope.subcategoryId)?.name;
    return subName ? `${categoryName} › ${subName}` : categoryName;
  };
  const scopesText = budget.scopes.map(scopeLabel).join(', ');

  const goToTransactions = () => {
    const params = new URLSearchParams({ type: 'EXPENSE', period });
    const [first] = budget.scopes;
    if (budget.scopes.length === 1 && first) {
      params.set('categoryId', first.categoryId);
      if (first.subcategoryId) params.set('subcategoryId', first.subcategoryId);
    }
    navigate(`/transacoes?${params.toString()}`);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <span
              className={cn('size-3 shrink-0 rounded-full', color.bgClass)}
              aria-hidden="true"
            />
            <span className="truncate">{budget.name}</span>
          </CardTitle>
          <p className="truncate text-muted-foreground text-xs" title={scopesText}>
            {scopesText}
          </p>
          {overspent ? (
            <Badge variant="destructive" className="w-fit text-xs">
              Estourado
            </Badge>
          ) : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" aria-label="Ações do orçamento" />}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(budget)}>
              <Pencil className="mr-2 size-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(budget)}>
              <Trash2 className="mr-2 size-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent
        role="button"
        tabIndex={0}
        onClick={goToTransactions}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goToTransactions();
          }
        }}
        aria-label={`Ver transações de ${budget.name}`}
        className="flex cursor-pointer flex-col gap-3 rounded-b-xl outline-none transition-colors hover:bg-accent/40 focus-visible:bg-accent/40"
      >
        <div className="flex items-baseline justify-between text-sm">
          <span className={cn('font-semibold', overspent && 'text-expense')}>
            {formatMoney(budget.spent)}
          </span>
          <span className="text-muted-foreground">de {formatMoney(budget.planned)}</span>
        </div>
        <BudgetProgressBar percentSpent={budget.percentSpent} />
        <div className="flex items-baseline justify-between text-muted-foreground text-xs">
          <span>{budget.percentSpent}% gasto</span>
          <span>
            {overspent ? 'Excesso ' : 'Restante '}
            <span className={cn('font-medium', overspent ? 'text-expense' : 'text-foreground')}>
              {formatMoney(budget.remaining)}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
