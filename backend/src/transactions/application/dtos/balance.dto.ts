import type { MoneySnapshot } from '@/shared/domain';

export interface BalanceDTO {
  balance: MoneySnapshot;
  income: MoneySnapshot;
  expense: MoneySnapshot;
  startDate: Date;
  endDate: Date;
}
