import type { DomainEvent, MoneySnapshot } from '@/shared/domain';
import type { TransactionType } from '../value-objects/transaction-type';

export interface TransactionUpdatedPayload {
  transactionId: string;
  userId: string;
  amount: MoneySnapshot;
  type: TransactionType;
  categoryId: string;
  subcategoryId: string | null;
  description: string;
  date: Date;
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
