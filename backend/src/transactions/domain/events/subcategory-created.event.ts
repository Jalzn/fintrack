import type { DomainEvent } from '@/shared/domain';

export interface SubcategoryCreatedPayload {
  subcategoryId: string;
  userId: string;
  categoryId: string;
  name: string;
}

export class SubcategoryCreatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'subcategory.created';
  readonly occurredOn: Date;
  readonly payload: SubcategoryCreatedPayload;

  constructor(payload: SubcategoryCreatedPayload) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
