import type { MoneySnapshot } from '@/shared/domain';

export interface PeriodSpendDTO {
  period: string; // 'YYYY-MM' (month) or 'YYYY-Www' (ISO week)
  spend: MoneySnapshot;
}

export interface DepartmentSpendDTO {
  department: string; // null department falls into 'outros'
  spend: MoneySnapshot;
}

export interface StoreSpendDTO {
  storeName: string;
  spend: MoneySnapshot;
}

export interface ProductSpendDTO {
  normalizedName: string;
  totalSpend: MoneySnapshot;
  purchaseCount: number;
}

export interface GrocerySummaryDTO {
  spendByPeriod: PeriodSpendDTO[];
  byDepartment: DepartmentSpendDTO[];
  byStore: StoreSpendDTO[];
  topProductsBySpend: ProductSpendDTO[];
  topProductsByFrequency: ProductSpendDTO[];
  currencyCode: string;
}
