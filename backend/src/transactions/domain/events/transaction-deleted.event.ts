import type { DomainEvent } from '@/shared/domain';

export class TransactionDeletedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'transaction.deleted';
  readonly occurredOn: Date;
  readonly transactionId: string;

  constructor(transactionId: string) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.transactionId = transactionId;
  }
}
