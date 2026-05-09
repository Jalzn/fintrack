import type { Transaction } from '@/transactions/domain';
import type { TransactionDTO } from '../dtos';

export function toTransactionDTO(transaction: Transaction): TransactionDTO {
  return {
    id: transaction.id,
    amount: transaction.amount.toSnapshot(),
    type: transaction.type,
    categoryId: transaction.categoryId,
    subcategoryId: transaction.subcategoryId,
    description: transaction.description,
    date: transaction.date,
    createdAt: transaction.createdAt,
  };
}
