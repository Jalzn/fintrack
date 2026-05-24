import { ArrowDownRight, ArrowRight, ArrowUpRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Sparkline } from '@/components/Sparkline';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatMoney, moneyToNumber } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { PriceAnalysisRow } from '@/types/api';
import { ProductHistoryDialog } from './ProductHistoryDialog';

interface ProductPriceListProps {
  products: PriceAnalysisRow[];
  /** Show a search box (full index). */
  showSearch?: boolean;
  /** Cap the number of rows (overview shortcut). */
  limit?: number;
}

/** Searchable personal price index: trend, min–max range and sparkline per product. */
export function ProductPriceList({ products, showSearch = false, limit }: ProductPriceListProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    let result = [...products].sort((a, b) => b.count - a.count);
    if (term) result = result.filter((p) => p.normalizedName.toLowerCase().includes(term));
    if (limit != null) result = result.slice(0, limit);
    return result;
  }, [products, query, limit]);

  return (
    <div className="space-y-3">
      {showSearch ? (
        <div className="relative">
          <Label htmlFor="product-search" className="sr-only">
            Buscar produto
          </Label>
          <Search
            className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="product-search"
            placeholder="Buscar produto…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground text-sm">
          {query ? `Nenhum produto encontrado para “${query}”.` : 'Nenhum produto ainda.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((product) => (
            <li key={product.normalizedName}>
              <ProductRow product={product} onSelect={() => setSelected(product.normalizedName)} />
            </li>
          ))}
        </ul>
      )}

      <ProductHistoryDialog
        normalizedName={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}

function ProductRow({ product, onSelect }: { product: PriceAnalysisRow; onSelect: () => void }) {
  const last = moneyToNumber(product.lastUnitPrice);
  const avg = moneyToNumber(product.avgUnitPrice);
  const trendPct = avg > 0 ? Math.round(((last - avg) / avg) * 100) : 0;
  const spark = product.occurrences.map((o) => ({ value: moneyToNumber(o.unitPrice) }));

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium capitalize">{product.normalizedName}</p>
          <p className="text-muted-foreground text-xs">{product.count} compras</p>
        </div>
        <div className="flex items-center gap-3">
          {spark.length >= 2 ? (
            <div className="hidden h-8 w-20 sm:block">
              <Sparkline data={spark} />
            </div>
          ) : null}
          <div className="text-right">
            <p className="font-medium tabular-nums">{formatMoney(product.lastUnitPrice)}</p>
            <TrendBadge pct={trendPct} />
          </div>
        </div>
      </div>
      <RangeBar product={product} />
    </button>
  );
}

function TrendBadge({ pct }: { pct: number }) {
  if (pct === 0) {
    return <span className="text-muted-foreground text-xs">estável</span>;
  }
  const isUp = pct > 0;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'flex items-center justify-end gap-0.5 font-medium text-xs',
        isUp ? 'text-expense' : 'text-income',
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {Math.abs(pct)}%
    </span>
  );
}

function RangeBar({ product }: { product: PriceAnalysisRow }) {
  const min = moneyToNumber(product.minUnitPrice);
  const max = moneyToNumber(product.maxUnitPrice);
  const last = moneyToNumber(product.lastUnitPrice);
  const pos = max > min ? ((last - min) / (max - min)) * 100 : 50;

  return (
    <div className="space-y-1">
      <div className="relative h-1.5 rounded-full bg-muted">
        <span
          className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 size-2.5 rounded-full bg-foreground"
          style={{ left: `${pos}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <ArrowRight className="size-2.5 rotate-180" aria-hidden />
          {formatMoney(product.minUnitPrice)}
        </span>
        <span className="flex items-center gap-1">
          {formatMoney(product.maxUnitPrice)}
          <ArrowRight className="size-2.5" aria-hidden />
        </span>
      </div>
    </div>
  );
}
