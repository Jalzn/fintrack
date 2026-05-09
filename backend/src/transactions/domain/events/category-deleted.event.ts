import type { DomainEvent } from '@/shared/domain';

export class CategoryDeletedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'category.deleted';
  readonly occurredOn: Date;
  readonly categoryId: string;

  constructor(categoryId: string) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.categoryId = categoryId;
  }
}
