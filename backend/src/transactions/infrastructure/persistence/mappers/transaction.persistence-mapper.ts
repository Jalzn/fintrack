import type { CurrencyCode } from '@/shared/domain';
import { currencyByCode, Money } from '@/shared/domain';
import type { TransactionType } from '@/transactions/domain';
import { Transaction } from '@/transactions/domain';
import type { NewTransactionRow, TransactionRow } from '../schema';

export function transactionRowToDomain(row: TransactionRow): Transaction {
  const currency = currencyByCode[row.currencyCode as CurrencyCode];
  const amount = Money.fromSnapshot({ amount: Number(row.amountMinorUnits), currency });

  return Transaction.restore({
    id: row.id,
    userId: row.userId,
    amount,
    type: row.type as TransactionType,
    categoryId: row.categoryId,
    subcategoryId: row.subcategoryId,
    description: row.description,
    date: row.date,
    createdAt: row.createdAt,
    ...(row.linkedTransactionId !== null && { linkedTransactionId: row.linkedTransactionId }),
  });
}

export function transactionToRow(transaction: Transaction): NewTransactionRow {
  const snapshot = transaction.amount.toSnapshot();
  return {
    id: transaction.id,
    userId: transaction.userId,
    amountMinorUnits: String(snapshot.amount),
    currencyCode: snapshot.currency.code,
    type: transaction.type,
    categoryId: transaction.categoryId,
    subcategoryId: transaction.subcategoryId,
    description: transaction.description,
    date: transaction.date,
    createdAt: transaction.createdAt,
    linkedTransactionId: transaction.linkedTransactionId ?? null,
  };
}
