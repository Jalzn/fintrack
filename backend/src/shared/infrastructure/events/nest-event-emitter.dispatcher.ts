import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { IDomainEventDispatcher } from '@/shared/application';
import type { DomainEvent } from '@/shared/domain';

export class NestEventEmitterDispatcher implements IDomainEventDispatcher {
  constructor(@Inject(EventEmitter2) private readonly emitter: EventEmitter2) {}

  async dispatch(events: ReadonlyArray<DomainEvent>): Promise<void> {
    for (const event of events) {
      this.emitter.emit(event.eventName, event);
    }
  }
}
