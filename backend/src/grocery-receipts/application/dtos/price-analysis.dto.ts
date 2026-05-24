import type { MoneySnapshot } from '@/shared/domain';

export interface PriceOccurrenceDTO {
  date: Date;
  storeName: string;
  unitPrice: MoneySnapshot;
  quantity: number;
}

export interface PriceAnalysisRowDTO {
  normalizedName: string;
  count: number;
  lastUnitPrice: MoneySnapshot;
  minUnitPrice: MoneySnapshot;
  maxUnitPrice: MoneySnapshot;
  avgUnitPrice: MoneySnapshot;
  occurrences: PriceOccurrenceDTO[];
}

export interface PriceAnalysisDTO {
  products: PriceAnalysisRowDTO[];
}
