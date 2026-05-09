import type { DomainEvent } from '@/shared/domain';
import type { TransactionType } from '../value-objects/transaction-type';

export interface CategoryCreatedPayload {
  categoryId: string;
  userId: string;
  name: string;
  color: string;
  type: TransactionType;
}

export class CategoryCreatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'category.created';
  readonly occurredOn: Date;
  readonly payload: CategoryCreatedPayload;

  constructor(payload: CategoryCreatedPayload) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
