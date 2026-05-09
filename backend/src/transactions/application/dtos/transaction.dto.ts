import type { MoneySnapshot } from '@/shared/domain';
import type { TransactionType } from '@/transactions/domain';

export interface TransactionDTO {
  id: string;
  amount: MoneySnapshot;
  type: TransactionType;
  categoryId: string;
  subcategoryId: string | null;
  description: string;
  date: Date;
  createdAt: Date;
}
