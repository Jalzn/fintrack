import type { DomainEvent } from '@/shared/domain';
import type { TransactionType } from '../value-objects/transaction-type';

export interface CategoryUpdatedPayload {
  categoryId: string;
  userId: string;
  name: string;
  color: string;
  type: TransactionType;
}

export class CategoryUpdatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'category.updated';
  readonly occurredOn: Date;
  readonly payload: CategoryUpdatedPayload;

  constructor(payload: CategoryUpdatedPayload) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
