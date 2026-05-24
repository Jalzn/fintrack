export interface ReceiptListFilters {
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

export interface PriceAnalysisParams {
  startDate?: string;
  endDate?: string;
}

export interface GrocerySummaryParams {
  startDate?: string;
  endDate?: string;
  granularity: 'week' | 'month';
}

export const groceryKeys = {
  all: ['groceries'] as const,
  lists: () => [...groceryKeys.all, 'list'] as const,
  list: (filters: ReceiptListFilters) => [...groceryKeys.lists(), filters] as const,
  details: () => [...groceryKeys.all, 'detail'] as const,
  detail: (id: string) => [...groceryKeys.details(), id] as const,
  priceAnalysis: (params: PriceAnalysisParams) =>
    [...groceryKeys.all, 'price-analysis', params] as const,
  summary: (params: GrocerySummaryParams) => [...groceryKeys.all, 'summary', params] as const,
  settings: () => [...groceryKeys.all, 'settings'] as const,
};
