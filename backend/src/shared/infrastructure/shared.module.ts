import { Global, Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DrizzleModule } from './database/drizzle.module';
import { NestEventEmitterDispatcher } from './events/nest-event-emitter.dispatcher';
import { CryptoIdGenerator } from './id/crypto-id.generator';
import { EVENT_DISPATCHER, ID_GENERATOR } from './shared.tokens';

@Global()
@Module({
  imports: [DrizzleModule],
  providers: [
    {
      provide: ID_GENERATOR,
      useFactory: () => new CryptoIdGenerator(),
    },
    {
      provide: EVENT_DISPATCHER,
      useFactory: (emitter: EventEmitter2) => new NestEventEmitterDispatcher(emitter),
      inject: [EventEmitter2],
    },
  ],
  exports: [DrizzleModule, ID_GENERATOR, EVENT_DISPATCHER],
})
export class SharedModule {}
