import type { DomainEvent, MoneySnapshot } from '@/shared/domain';
import type { TransactionType } from '../value-objects/transaction-type';

export interface TransactionUpdatedPreviousSnapshot {
  amount: MoneySnapshot;
  categoryId: string;
  subcategoryId: string | null;
  date: Date;
}

export interface TransactionUpdatedPayload {
  transactionId: string;
  userId: string;
  amount: MoneySnapshot;
  type: TransactionType;
  categoryId: string;
  subcategoryId: string | null;
  description: string;
  date: Date;
  previous: TransactionUpdatedPreviousSnapshot;
}

export class TransactionUpdatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'transaction.updated';
  readonly occurredOn: Date;
  readonly payload: TransactionUpdatedPayload;

  constructor(payload: TransactionUpdatedPayload) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
