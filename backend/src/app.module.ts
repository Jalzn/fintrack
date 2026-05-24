import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from 'nestjs-pino';
import { BudgetsModule } from '@/budgets/infrastructure/budgets.module';
import { validateEnv } from '@/core/env.schema';
import { GroceryReceiptsModule } from '@/grocery-receipts/infrastructure/grocery-receipts.module';
import { DomainExceptionFilter } from '@/shared/infrastructure/http/domain-exception.filter';
import { HealthController } from '@/shared/infrastructure/http/health.controller';
import { SharedModule } from '@/shared/infrastructure/shared.module';
import { TransactionsModule } from '@/transactions/infrastructure/transactions.module';
import { UsersModule } from '@/users/infrastructure/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRoot(
      process.env['NODE_ENV'] !== 'production'
        ? {
            pinoHttp: {
              level: 'debug',
              transport: { target: 'pino-pretty', options: { colorize: true } },
            },
          }
        : { pinoHttp: { level: 'info' } },
    ),
    EventEmitterModule.forRoot(),
    SharedModule,
    UsersModule,
    TransactionsModule,
    BudgetsModule,
    GroceryReceiptsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: DomainExceptionFilter }],
})
export class AppModule {}
