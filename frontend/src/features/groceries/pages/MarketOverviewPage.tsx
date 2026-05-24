import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePeriod } from '@/hooks/use-period';
import { moneyToNumber } from '@/lib/money';
import { lastNPeriods, periodToRange, previousPeriod } from '@/lib/period';
import type { MoneySnapshot } from '@/types/api';
import { GroceryInsightStrip } from '../components/GroceryInsightStrip';
import { GroceryStats } from '../components/GroceryStats';
import { ProductPriceList } from '../components/ProductPriceList';
import { RecentReceipts } from '../components/RecentReceipts';
import { SpendByDepartmentChart } from '../components/SpendByDepartmentChart';
import { SpendByStoreChart } from '../components/SpendByStoreChart';
import { SpendOverTimeChart } from '../components/SpendOverTimeChart';
import { useGrocerySummaryQuery } from '../hooks/use-grocery-summary-query';
import { usePriceAnalysisQuery } from '../hooks/use-price-analysis-query';
import { useReceiptsQuery } from '../hooks/use-receipts-query';
import { biggestRiser, buildGroceryInsights } from '../lib/grocery-insights';

const BRL: MoneySnapshot['currency'] = { code: 'BRL', base: 10, exponent: 2 };
const TREND_MONTHS = 6;

/** `/mercado` — visão geral: KPIs, evolução, breakdown, alertas e últimas compras. */
export function MarketOverviewPage() {
  const { period, range } = usePeriod();

  const windowStart = periodToRange(lastNPeriods(period, TREND_MONTHS)[0] ?? period).startDate;
  const windowSummary = useGrocerySummaryQuery({
    granularity: 'month',
    startDate: windowStart,
    endDate: range.endDate,
  });
  const periodSummary = useGrocerySummaryQuery({
    granularity: 'month',
    startDate: range.startDate,
    endDate: range.endDate,
  });
  const receipts = useReceiptsQuery({ page: 1, limit: 5, ...range });
  const analysis = usePriceAnalysisQuery();

  const statsLoading = windowSummary.isLoading || receipts.isLoading;
  const isError = windowSummary.isError || periodSummary.isError;

  const currency =
    windowSummary.data?.spendByPeriod[0]?.spend.currency ??
    periodSummary.data?.byDepartment[0]?.spend.currency ??
    BRL;
  const zero: MoneySnapshot = { amount: 0, currency };

  const windowMap = new Map(
    (windowSummary.data?.spendByPeriod ?? []).map((p) => [p.period, p.spend] as const),
  );
  const currentSpend = windowMap.get(period) ?? zero;
  const previousSpend = windowMap.get(previousPeriod(period)) ?? zero;
  const trend = (windowSummary.data?.spendByPeriod ?? []).map((p) => ({
    value: moneyToNumber(p.spend),
  }));
  const visits = receipts.data?.total ?? 0;
  const products = analysis.data?.products ?? [];
  const topRiser = biggestRiser(products);
  const insights = buildGroceryInsights({
    priceAnalysis: analysis.data,
    summary: windowSummary.data,
  });

  if (isError) {
    return <p className="text-destructive text-sm">Erro ao carregar os dados de mercado.</p>;
  }

  const byDepartment = periodSummary.data?.byDepartment ?? [];
  const byStore = periodSummary.data?.byStore ?? [];
  const hasTrend = trend.some((t) => t.value > 0);

  return (
    <div className="space-y-6">
      <GroceryStats
        currentSpend={currentSpend}
        previousSpend={previousSpend}
        trend={trend}
        visits={visits}
        topRiser={topRiser}
        isLoading={statsLoading}
      />

      <GroceryInsightStrip insights={insights} />

      {statsLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : hasTrend ? (
        <Card>
          <CardHeader>
            <CardTitle>Evolução dos gastos</CardTitle>
            <CardDescription>Quanto você gastou em mercado nos últimos meses.</CardDescription>
          </CardHeader>
          <CardContent>
            <SpendOverTimeChart data={windowSummary.data?.spendByPeriod ?? []} />
          </CardContent>
        </Card>
      ) : null}

      {byDepartment.length > 0 || byStore.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Para onde vai</CardTitle>
              <CardDescription>Gasto por departamento no período.</CardDescription>
            </CardHeader>
            <CardContent>
              <SpendByDepartmentChart data={byDepartment} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Por loja</CardTitle>
              <CardDescription>Em quais mercados você gasta mais.</CardDescription>
            </CardHeader>
            <CardContent>
              <SpendByStoreChart data={byStore} />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {products.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Seus preços</CardTitle>
              <CardDescription>Os itens que você mais acompanha.</CardDescription>
            </div>
            <Link
              to="/mercado/precos"
              className="text-muted-foreground text-sm transition-colors hover:text-foreground"
            >
              Ver índice completo
            </Link>
          </CardHeader>
          <CardContent>
            <ProductPriceList products={products} limit={5} />
          </CardContent>
        </Card>
      ) : null}

      <RecentReceipts
        receipts={receipts.data?.data}
        isLoading={receipts.isLoading}
        isError={receipts.isError}
      />
    </div>
  );
}
