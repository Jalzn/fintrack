import type { DomainEvent, MoneySnapshot } from '@/shared/domain';

export interface BudgetCreatedPayload {
  budgetId: string;
  userId: string;
  periodStart: Date;
  planned: MoneySnapshot;
}

export class BudgetCreatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'budget.created';
  readonly occurredOn: Date;
  readonly payload: BudgetCreatedPayload;

  constructor(payload: BudgetCreatedPayload) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
