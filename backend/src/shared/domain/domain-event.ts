export interface DomainEvent {
  readonly eventId: string;
  readonly eventName: string;
  readonly occurredOn: Date;
}
