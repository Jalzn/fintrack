import type { DomainEvent, MoneySnapshot } from '@/shared/domain';
import type { TransactionType } from '../value-objects/transaction-type';

export interface TransactionCreatedPayload {
  transactionId: string;
  userId: string;
  amount: MoneySnapshot;
  type: TransactionType;
  categoryId: string;
  subcategoryId: string | null;
  description: string;
  date: Date;
  createdAt: Date;
  linkedTransactionId: string | undefined;
}

export class TransactionCreatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'transaction.created';
  readonly occurredOn: Date;
  readonly payload: TransactionCreatedPayload;

  constructor(payload: TransactionCreatedPayload) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
