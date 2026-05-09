import { Global, Module } from '@nestjs/common';
import { DrizzleService } from './drizzle.service';
import { DRIZZLE_DB } from './drizzle.tokens';

@Global()
@Module({
  providers: [
    DrizzleService,
    {
      provide: DRIZZLE_DB,
      useFactory: (service: DrizzleService) => service.db,
      inject: [DrizzleService],
    },
  ],
  exports: [DRIZZLE_DB],
})
export class DrizzleModule {}
