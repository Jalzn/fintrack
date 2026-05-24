import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import type { IDomainEventDispatcher } from '@/shared/application';
import type { DomainEvent } from '@/shared/domain';

export class NestEventEmitterDispatcher implements IDomainEventDispatcher {
  constructor(
    @Inject(EventEmitter2) private readonly emitter: EventEmitter2,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {}

  async dispatch(events: ReadonlyArray<DomainEvent>): Promise<void> {
    for (const event of events) {
      try {
        await this.emitter.emitAsync(event.eventName, event);
      } catch (err) {
        this.logger.error(
          { err, eventName: event.eventName, eventId: event.eventId },
          'Domain event handler failed',
        );
      }
    }
  }
}
