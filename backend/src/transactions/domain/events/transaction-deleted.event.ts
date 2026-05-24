import type { DomainEvent, MoneySnapshot } from '@/shared/domain';
import type { TransactionType } from '../value-objects/transaction-type';

export interface TransactionDeletedPayload {
  transactionId: string;
  userId: string;
  amount: MoneySnapshot;
  type: TransactionType;
  categoryId: string;
  subcategoryId: string | null;
  date: Date;
  linkedTransactionId: string | undefined;
}

export class TransactionDeletedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'transaction.deleted';
  readonly occurredOn: Date;
  readonly payload: TransactionDeletedPayload;

  constructor(payload: TransactionDeletedPayload) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.payload = payload;
  }

  get transactionId(): string {
    return this.payload.transactionId;
  }
}
