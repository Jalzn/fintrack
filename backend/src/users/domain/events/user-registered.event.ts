import type { DomainEvent } from '@/shared/domain';

export interface UserRegisteredPayload {
  userId: string;
  email: string;
  createdAt: Date;
}

export class UserRegisteredEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'user.registered';
  readonly occurredOn: Date;
  readonly payload: UserRegisteredPayload;

  constructor(payload: UserRegisteredPayload) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
