import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductPriceList } from '../components/ProductPriceList';
import { TopProductsChart } from '../components/TopProductsChart';
import { useGrocerySummaryQuery } from '../hooks/use-grocery-summary-query';
import { usePriceAnalysisQuery } from '../hooks/use-price-analysis-query';

/** `/mercado/precos` — índice pessoal de preços (busca) + produtos em destaque. */
export function PricesPage() {
  const { data: analysis, isLoading, isError } = usePriceAnalysisQuery();
  const { data: summary } = useGrocerySummaryQuery({ granularity: 'month' });

  if (isError) {
    return <p className="text-destructive text-sm">Erro ao carregar a análise de preços.</p>;
  }

  const products = analysis?.products ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Seus preços</CardTitle>
          <CardDescription>
            Quanto você costuma pagar por cada item. Clique para ver o histórico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : products.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Importe notas para ver a análise de preços por item.
            </p>
          ) : (
            <ProductPriceList products={products} showSearch />
          )}
        </CardContent>
      </Card>

      {summary && summary.topProductsBySpend.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Produtos em destaque</CardTitle>
            <CardDescription>Os itens que mais pesam no seu carrinho.</CardDescription>
          </CardHeader>
          <CardContent>
            <TopProductsChart
              bySpend={summary.topProductsBySpend}
              byFrequency={summary.topProductsByFrequency}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
