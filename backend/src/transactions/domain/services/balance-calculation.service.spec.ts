import { describe, expect, it } from 'vitest';
import { Money, USD } from '@/shared/domain';
import { Transaction } from '../entities/transaction.entity';
import { TransactionType } from '../value-objects/transaction-type';
import { BalanceCalculationService } from './balance-calculation.service';

const makeTransaction = (type: TransactionType, amountMinorUnits: number) =>
  Transaction.create({
    id: crypto.randomUUID(),
    userId: 'user-1',
    amount: Money.of(amountMinorUnits, USD),
    type,
    categoryId: 'cat-1',
    description: 'Test transaction',
    date: new Date('2024-01-15'),
  });

describe('BalanceCalculationService', () => {
  const service = new BalanceCalculationService();

  it('returns zero for empty list', () => {
    const summary = service.calculate([], USD);
    expect(summary.balance.toDecimal()).toBe('0.00');
    expect(summary.income.toDecimal()).toBe('0.00');
    expect(summary.expense.toDecimal()).toBe('0.00');
  });

  it('sums income transactions', () => {
    const transactions = [
      makeTransaction(TransactionType.INCOME, 10000),
      makeTransaction(TransactionType.INCOME, 5000),
    ];
    const summary = service.calculate(transactions, USD);
    expect(summary.balance.toDecimal()).toBe('150.00');
    expect(summary.income.toDecimal()).toBe('150.00');
    expect(summary.expense.toDecimal()).toBe('0.00');
  });

  it('subtracts expense transactions', () => {
    const transactions = [
      makeTransaction(TransactionType.EXPENSE, 3000),
      makeTransaction(TransactionType.EXPENSE, 2000),
    ];
    const summary = service.calculate(transactions, USD);
    expect(summary.balance.toDecimal()).toBe('-50.00');
    expect(summary.income.toDecimal()).toBe('0.00');
    expect(summary.expense.toDecimal()).toBe('50.00');
  });

  it('calculates net balance from income and expenses', () => {
    const transactions = [
      makeTransaction(TransactionType.INCOME, 10000),
      makeTransaction(TransactionType.EXPENSE, 3000),
      makeTransaction(TransactionType.INCOME, 5000),
      makeTransaction(TransactionType.EXPENSE, 1000),
    ];
    const summary = service.calculate(transactions, USD);
    expect(summary.balance.toDecimal()).toBe('110.00');
    expect(summary.income.toDecimal()).toBe('150.00');
    expect(summary.expense.toDecimal()).toBe('40.00');
  });
});
