import type { IDomainEventDispatcher } from '@/shared/application';
import type { DomainEvent } from '@/shared/domain';

export class InMemoryDomainEventDispatcher implements IDomainEventDispatcher {
  readonly dispatched: DomainEvent[] = [];

  async dispatch(events: ReadonlyArray<DomainEvent>): Promise<void> {
    this.dispatched.push(...events);
  }

  get lastEvent(): DomainEvent | undefined {
    return this.dispatched.at(-1);
  }

  reset(): void {
    this.dispatched.length = 0;
  }
}
