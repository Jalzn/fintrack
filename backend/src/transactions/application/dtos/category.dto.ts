import type { TransactionType } from '@/transactions/domain';

export interface CategoryDTO {
  id: string;
  name: string;
  color: string;
  type: TransactionType;
}
