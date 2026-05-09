import type { DomainEvent } from '@/shared/domain';

export interface IDomainEventDispatcher {
  dispatch(events: ReadonlyArray<DomainEvent>): Promise<void>;
}
