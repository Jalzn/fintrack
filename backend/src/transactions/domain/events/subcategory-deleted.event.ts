import type { DomainEvent } from '@/shared/domain';

export class SubcategoryDeletedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'subcategory.deleted';
  readonly occurredOn: Date;
  readonly subcategoryId: string;

  constructor(subcategoryId: string) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.subcategoryId = subcategoryId;
  }
}
