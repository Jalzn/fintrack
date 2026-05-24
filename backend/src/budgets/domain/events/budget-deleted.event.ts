import type { DomainEvent } from '@/shared/domain';

export interface BudgetDeletedPayload {
  budgetId: string;
  userId: string;
}

export class BudgetDeletedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'budget.deleted';
  readonly occurredOn: Date;
  readonly payload: BudgetDeletedPayload;

  constructor(payload: BudgetDeletedPayload) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
