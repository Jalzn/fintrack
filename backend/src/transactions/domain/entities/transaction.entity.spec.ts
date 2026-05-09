import { describe, expect, it } from 'vitest';
import { Money, USD } from '@/shared/domain';
import { InvalidTransactionError } from '../errors';
import { TransactionCreatedEvent } from '../events';
import { TransactionType } from '../value-objects/transaction-type';
import { Transaction } from './transaction.entity';

const validProps = () => ({
  id: 'txn-1',
  userId: 'user-1',
  amount: Money.of(5000, USD),
  type: TransactionType.EXPENSE,
  categoryId: 'cat-1',
  description: 'Groceries',
  date: new Date('2024-01-15'),
});

describe('Transaction.create', () => {
  it('creates a valid transaction', () => {
    const txn = Transaction.create(validProps());
    expect(txn.id).toBe('txn-1');
    expect(txn.description).toBe('Groceries');
    expect(txn.createdAt).toBeInstanceOf(Date);
  });

  it('emits TransactionCreatedEvent', () => {
    const txn = Transaction.create(validProps());
    expect(txn.domainEvents).toHaveLength(1);
    expect(txn.domainEvents[0]).toBeInstanceOf(TransactionCreatedEvent);
  });

  it('event payload contains correct data', () => {
    const props = validProps();
    const txn = Transaction.create(props);
    const event = txn.domainEvents[0] as TransactionCreatedEvent;
    expect(event.payload.transactionId).toBe('txn-1');
    expect(event.payload.categoryId).toBe('cat-1');
    expect(event.payload.type).toBe(TransactionType.EXPENSE);
  });

  it('clears domain events', () => {
    const txn = Transaction.create(validProps());
    txn.clearDomainEvents();
    expect(txn.domainEvents).toHaveLength(0);
  });

  it('throws on empty id', () => {
    expect(() => Transaction.create({ ...validProps(), id: '' })).toThrow(InvalidTransactionError);
  });

  it('throws on empty userId', () => {
    expect(() => Transaction.create({ ...validProps(), userId: '' })).toThrow(
      InvalidTransactionError,
    );
  });

  it('throws on zero amount', () => {
    expect(() => Transaction.create({ ...validProps(), amount: Money.of(0, USD) })).toThrow(
      InvalidTransactionError,
    );
  });

  it('throws on negative amount', () => {
    expect(() => Transaction.create({ ...validProps(), amount: Money.of(-100, USD) })).toThrow(
      InvalidTransactionError,
    );
  });

  it('throws on empty categoryId', () => {
    expect(() => Transaction.create({ ...validProps(), categoryId: '' })).toThrow(
      InvalidTransactionError,
    );
  });

  it('throws on empty description', () => {
    expect(() => Transaction.create({ ...validProps(), description: '   ' })).toThrow(
      InvalidTransactionError,
    );
  });

  it('throws on description exceeding 255 characters', () => {
    expect(() => Transaction.create({ ...validProps(), description: 'a'.repeat(256) })).toThrow(
      InvalidTransactionError,
    );
  });

  it('throws on invalid date', () => {
    expect(() => Transaction.create({ ...validProps(), date: new Date('invalid') })).toThrow(
      InvalidTransactionError,
    );
  });
});

describe('Transaction.restore', () => {
  it('restores without validation', () => {
    const restored = Transaction.restore({
      id: 'txn-old',
      userId: 'user-1',
      amount: Money.of(100, USD),
      type: TransactionType.INCOME,
      categoryId: 'cat-1',
      description: 'Salary',
      date: new Date('2024-01-01'),
      createdAt: new Date('2024-01-01'),
    });
    expect(restored.id).toBe('txn-old');
    expect(restored.domainEvents).toHaveLength(0);
  });
});
