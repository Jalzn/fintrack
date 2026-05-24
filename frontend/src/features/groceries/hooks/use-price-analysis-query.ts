import { useQuery } from '@tanstack/react-query';
import type { PriceAnalysis } from '@/types/api';
import { getPriceAnalysis } from '../api/groceries';
import { groceryKeys, type PriceAnalysisParams } from '../api/keys';

export function usePriceAnalysisQuery(params: PriceAnalysisParams = {}) {
  return useQuery<PriceAnalysis>({
    queryKey: groceryKeys.priceAnalysis(params),
    queryFn: () => getPriceAnalysis(params),
  });
}
