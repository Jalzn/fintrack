import type { DomainEvent } from '@/shared/domain';

export interface SubcategoryUpdatedPayload {
  subcategoryId: string;
  userId: string;
  categoryId: string;
  name: string;
}

export class SubcategoryUpdatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'subcategory.updated';
  readonly occurredOn: Date;
  readonly payload: SubcategoryUpdatedPayload;

  constructor(payload: SubcategoryUpdatedPayload) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
