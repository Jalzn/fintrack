import { forwardRef, Module } from '@nestjs/common';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { PinoLogger } from 'nestjs-pino';
import {
  CopyBudgetsFromPreviousMonthUseCase,
  CreateBudgetUseCase,
  DeleteBudgetUseCase,
  GetBudgetByIdUseCase,
  ListBudgetsUseCase,
  UpdateBudgetUseCase,
} from '@/budgets/application';
import type { IBudgetRepository } from '@/budgets/domain';
import type { IDomainEventDispatcher, IIdGenerator } from '@/shared/application';
import { DRIZZLE_DB } from '@/shared/infrastructure/database/drizzle.tokens';
import { EVENT_DISPATCHER, ID_GENERATOR } from '@/shared/infrastructure/shared.tokens';
import type { ICategoryRepository, ISubcategoryRepository } from '@/transactions/domain';
import { CATEGORY_REPOSITORY, SUBCATEGORY_REPOSITORY } from '@/transactions/infrastructure/tokens';
import { TransactionsModule } from '@/transactions/infrastructure/transactions.module';
import { UsersModule } from '@/users/infrastructure/users.module';
import { BudgetSpentRecalculatorHandler } from './event-handlers/budget-spent-recalculator.handler';
import { BudgetsController } from './http/budgets.controller';
import { DrizzleBudgetRepository } from './persistence/repository/drizzle-budget.repository';
import {
  BUDGET_REPOSITORY,
  COPY_BUDGETS_UC,
  CREATE_BUDGET_UC,
  DELETE_BUDGET_UC,
  GET_BUDGET_BY_ID_UC,
  LIST_BUDGETS_UC,
  UPDATE_BUDGET_UC,
} from './tokens';

@Module({
  imports: [UsersModule, forwardRef(() => TransactionsModule)],
  controllers: [BudgetsController],
  providers: [
    {
      provide: BUDGET_REPOSITORY,
      useFactory: (db: PostgresJsDatabase) => new DrizzleBudgetRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: CREATE_BUDGET_UC,
      useFactory: (
        budgetRepository: IBudgetRepository,
        categoryRepository: ICategoryRepository,
        subcategoryRepository: ISubcategoryRepository,
        idGenerator: IIdGenerator,
        eventDispatcher: IDomainEventDispatcher,
        logger: PinoLogger,
      ) =>
        new CreateBudgetUseCase({
          budgetRepository,
          categoryRepository,
          subcategoryRepository,
          idGenerator,
          eventDispatcher,
          logger,
        }),
      inject: [
        BUDGET_REPOSITORY,
        CATEGORY_REPOSITORY,
        SUBCATEGORY_REPOSITORY,
        ID_GENERATOR,
        EVENT_DISPATCHER,
        PinoLogger,
      ],
    },
    {
      provide: UPDATE_BUDGET_UC,
      useFactory: (
        budgetRepository: IBudgetRepository,
        categoryRepository: ICategoryRepository,
        subcategoryRepository: ISubcategoryRepository,
        eventDispatcher: IDomainEventDispatcher,
      ) =>
        new UpdateBudgetUseCase({
          budgetRepository,
          categoryRepository,
          subcategoryRepository,
          eventDispatcher,
        }),
      inject: [BUDGET_REPOSITORY, CATEGORY_REPOSITORY, SUBCATEGORY_REPOSITORY, EVENT_DISPATCHER],
    },
    {
      provide: DELETE_BUDGET_UC,
      useFactory: (budgetRepository: IBudgetRepository, eventDispatcher: IDomainEventDispatcher) =>
        new DeleteBudgetUseCase({ budgetRepository, eventDispatcher }),
      inject: [BUDGET_REPOSITORY, EVENT_DISPATCHER],
    },
    {
      provide: GET_BUDGET_BY_ID_UC,
      useFactory: (budgetRepository: IBudgetRepository) =>
        new GetBudgetByIdUseCase({ budgetRepository }),
      inject: [BUDGET_REPOSITORY],
    },
    {
      provide: LIST_BUDGETS_UC,
      useFactory: (budgetRepository: IBudgetRepository) =>
        new ListBudgetsUseCase({ budgetRepository }),
      inject: [BUDGET_REPOSITORY],
    },
    {
      provide: COPY_BUDGETS_UC,
      useFactory: (
        budgetRepository: IBudgetRepository,
        idGenerator: IIdGenerator,
        eventDispatcher: IDomainEventDispatcher,
        logger: PinoLogger,
      ) =>
        new CopyBudgetsFromPreviousMonthUseCase({
          budgetRepository,
          idGenerator,
          eventDispatcher,
          logger,
        }),
      inject: [BUDGET_REPOSITORY, ID_GENERATOR, EVENT_DISPATCHER, PinoLogger],
    },
    BudgetSpentRecalculatorHandler,
  ],
  exports: [BUDGET_REPOSITORY],
})
export class BudgetsModule {}
