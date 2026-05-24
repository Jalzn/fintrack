import type { DomainEvent, MoneySnapshot } from '@/shared/domain';

export interface BudgetUpdatedPayload {
  budgetId: string;
  userId: string;
  planned: MoneySnapshot;
}

export class BudgetUpdatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'budget.updated';
  readonly occurredOn: Date;
  readonly payload: BudgetUpdatedPayload;

  constructor(payload: BudgetUpdatedPayload) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
