import { forwardRef, Module } from '@nestjs/common';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { PinoLogger } from 'nestjs-pino';
import type { IBudgetRepository } from '@/budgets/domain';
import { BudgetsModule } from '@/budgets/infrastructure/budgets.module';
import { BUDGET_REPOSITORY } from '@/budgets/infrastructure/tokens';
import type { IDomainEventDispatcher, IIdGenerator } from '@/shared/application';
import { DRIZZLE_DB } from '@/shared/infrastructure/database/drizzle.tokens';
import { EVENT_DISPATCHER, ID_GENERATOR } from '@/shared/infrastructure/shared.tokens';
import {
  CalculateBalanceUseCase,
  CreateCategoryUseCase,
  CreateSubcategoryUseCase,
  CreateTransactionUseCase,
  DeleteCategoryUseCase,
  DeleteSubcategoryUseCase,
  DeleteTransactionUseCase,
  GetCategoryByIdUseCase,
  GetSubcategoryByIdUseCase,
  GetTransactionByIdUseCase,
  ListCategoriesUseCase,
  ListSubcategoriesUseCase,
  ListTransactionsUseCase,
  UpdateCategoryUseCase,
  UpdateSubcategoryUseCase,
  UpdateTransactionUseCase,
} from '@/transactions/application';
import {
  BalanceCalculationService,
  type ICategoryRepository,
  type ISubcategoryRepository,
  type ITransactionRepository,
} from '@/transactions/domain';
import { UsersModule } from '@/users/infrastructure/users.module';
import { CategoriesController } from './http/categories.controller';
import { SubcategoriesController } from './http/subcategories.controller';
import { TransactionsController } from './http/transactions.controller';
import { DrizzleCategoryRepository } from './persistence/repository/drizzle-category.repository';
import { DrizzleSubcategoryRepository } from './persistence/repository/drizzle-subcategory.repository';
import { DrizzleTransactionRepository } from './persistence/repository/drizzle-transaction.repository';
import {
  CALCULATE_BALANCE_UC,
  CATEGORY_REPOSITORY,
  CREATE_CATEGORY_UC,
  CREATE_SUBCATEGORY_UC,
  CREATE_TRANSACTION_UC,
  DELETE_CATEGORY_UC,
  DELETE_SUBCATEGORY_UC,
  DELETE_TRANSACTION_UC,
  GET_CATEGORY_BY_ID_UC,
  GET_SUBCATEGORY_BY_ID_UC,
  GET_TRANSACTION_BY_ID_UC,
  LIST_CATEGORIES_UC,
  LIST_SUBCATEGORIES_UC,
  LIST_TRANSACTIONS_UC,
  SUBCATEGORY_REPOSITORY,
  TRANSACTION_REPOSITORY,
  UPDATE_CATEGORY_UC,
  UPDATE_SUBCATEGORY_UC,
  UPDATE_TRANSACTION_UC,
} from './tokens';

@Module({
  imports: [UsersModule, forwardRef(() => BudgetsModule)],
  controllers: [TransactionsController, CategoriesController, SubcategoriesController],
  providers: [
    // --- Repositories ---
    {
      provide: TRANSACTION_REPOSITORY,
      useFactory: (db: PostgresJsDatabase) => new DrizzleTransactionRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: CATEGORY_REPOSITORY,
      useFactory: (db: PostgresJsDatabase) => new DrizzleCategoryRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: SUBCATEGORY_REPOSITORY,
      useFactory: (db: PostgresJsDatabase) => new DrizzleSubcategoryRepository(db),
      inject: [DRIZZLE_DB],
    },

    // --- Domain service ---
    {
      provide: BalanceCalculationService,
      useFactory: () => new BalanceCalculationService(),
    },

    // --- Transaction use cases ---
    {
      provide: CREATE_TRANSACTION_UC,
      useFactory: (
        transactionRepository: ITransactionRepository,
        categoryRepository: ICategoryRepository,
        subcategoryRepository: ISubcategoryRepository,
        idGenerator: IIdGenerator,
        eventDispatcher: IDomainEventDispatcher,
        logger: PinoLogger,
      ) =>
        new CreateTransactionUseCase({
          transactionRepository,
          categoryRepository,
          subcategoryRepository,
          idGenerator,
          eventDispatcher,
          logger,
        }),
      inject: [
        TRANSACTION_REPOSITORY,
        CATEGORY_REPOSITORY,
        SUBCATEGORY_REPOSITORY,
        ID_GENERATOR,
        EVENT_DISPATCHER,
        PinoLogger,
      ],
    },
    {
      provide: GET_TRANSACTION_BY_ID_UC,
      useFactory: (transactionRepository: ITransactionRepository) =>
        new GetTransactionByIdUseCase({ transactionRepository }),
      inject: [TRANSACTION_REPOSITORY],
    },
    {
      provide: LIST_TRANSACTIONS_UC,
      useFactory: (transactionRepository: ITransactionRepository) =>
        new ListTransactionsUseCase({ transactionRepository }),
      inject: [TRANSACTION_REPOSITORY],
    },
    {
      provide: UPDATE_TRANSACTION_UC,
      useFactory: (
        transactionRepository: ITransactionRepository,
        categoryRepository: ICategoryRepository,
        subcategoryRepository: ISubcategoryRepository,
        eventDispatcher: IDomainEventDispatcher,
      ) =>
        new UpdateTransactionUseCase({
          transactionRepository,
          categoryRepository,
          subcategoryRepository,
          eventDispatcher,
        }),
      inject: [
        TRANSACTION_REPOSITORY,
        CATEGORY_REPOSITORY,
        SUBCATEGORY_REPOSITORY,
        EVENT_DISPATCHER,
      ],
    },
    {
      provide: DELETE_TRANSACTION_UC,
      useFactory: (
        transactionRepository: ITransactionRepository,
        eventDispatcher: IDomainEventDispatcher,
        logger: PinoLogger,
      ) => new DeleteTransactionUseCase({ transactionRepository, eventDispatcher, logger }),
      inject: [TRANSACTION_REPOSITORY, EVENT_DISPATCHER, PinoLogger],
    },
    {
      provide: CALCULATE_BALANCE_UC,
      useFactory: (
        transactionRepository: ITransactionRepository,
        balanceService: BalanceCalculationService,
      ) => new CalculateBalanceUseCase({ transactionRepository, balanceService }),
      inject: [TRANSACTION_REPOSITORY, BalanceCalculationService],
    },

    // --- Category use cases ---
    {
      provide: CREATE_CATEGORY_UC,
      useFactory: (
        categoryRepository: ICategoryRepository,
        idGenerator: IIdGenerator,
        eventDispatcher: IDomainEventDispatcher,
      ) => new CreateCategoryUseCase({ categoryRepository, idGenerator, eventDispatcher }),
      inject: [CATEGORY_REPOSITORY, ID_GENERATOR, EVENT_DISPATCHER],
    },
    {
      provide: UPDATE_CATEGORY_UC,
      useFactory: (
        categoryRepository: ICategoryRepository,
        eventDispatcher: IDomainEventDispatcher,
      ) => new UpdateCategoryUseCase({ categoryRepository, eventDispatcher }),
      inject: [CATEGORY_REPOSITORY, EVENT_DISPATCHER],
    },
    {
      provide: GET_CATEGORY_BY_ID_UC,
      useFactory: (categoryRepository: ICategoryRepository) =>
        new GetCategoryByIdUseCase({ categoryRepository }),
      inject: [CATEGORY_REPOSITORY],
    },
    {
      provide: LIST_CATEGORIES_UC,
      useFactory: (categoryRepository: ICategoryRepository) =>
        new ListCategoriesUseCase({ categoryRepository }),
      inject: [CATEGORY_REPOSITORY],
    },
    {
      provide: DELETE_CATEGORY_UC,
      useFactory: (
        categoryRepository: ICategoryRepository,
        subcategoryRepository: ISubcategoryRepository,
        budgetRepository: IBudgetRepository,
        eventDispatcher: IDomainEventDispatcher,
      ) =>
        new DeleteCategoryUseCase({
          categoryRepository,
          subcategoryRepository,
          budgetRepository,
          eventDispatcher,
        }),
      inject: [CATEGORY_REPOSITORY, SUBCATEGORY_REPOSITORY, BUDGET_REPOSITORY, EVENT_DISPATCHER],
    },

    // --- Subcategory use cases ---
    {
      provide: CREATE_SUBCATEGORY_UC,
      useFactory: (
        subcategoryRepository: ISubcategoryRepository,
        categoryRepository: ICategoryRepository,
        idGenerator: IIdGenerator,
        eventDispatcher: IDomainEventDispatcher,
      ) =>
        new CreateSubcategoryUseCase({
          subcategoryRepository,
          categoryRepository,
          idGenerator,
          eventDispatcher,
        }),
      inject: [SUBCATEGORY_REPOSITORY, CATEGORY_REPOSITORY, ID_GENERATOR, EVENT_DISPATCHER],
    },
    {
      provide: UPDATE_SUBCATEGORY_UC,
      useFactory: (
        subcategoryRepository: ISubcategoryRepository,
        eventDispatcher: IDomainEventDispatcher,
      ) => new UpdateSubcategoryUseCase({ subcategoryRepository, eventDispatcher }),
      inject: [SUBCATEGORY_REPOSITORY, EVENT_DISPATCHER],
    },
    {
      provide: GET_SUBCATEGORY_BY_ID_UC,
      useFactory: (subcategoryRepository: ISubcategoryRepository) =>
        new GetSubcategoryByIdUseCase({ subcategoryRepository }),
      inject: [SUBCATEGORY_REPOSITORY],
    },
    {
      provide: LIST_SUBCATEGORIES_UC,
      useFactory: (subcategoryRepository: ISubcategoryRepository) =>
        new ListSubcategoriesUseCase({ subcategoryRepository }),
      inject: [SUBCATEGORY_REPOSITORY],
    },
    {
      provide: DELETE_SUBCATEGORY_UC,
      useFactory: (
        subcategoryRepository: ISubcategoryRepository,
        budgetRepository: IBudgetRepository,
        eventDispatcher: IDomainEventDispatcher,
      ) =>
        new DeleteSubcategoryUseCase({ subcategoryRepository, budgetRepository, eventDispatcher }),
      inject: [SUBCATEGORY_REPOSITORY, BUDGET_REPOSITORY, EVENT_DISPATCHER],
    },
  ],
  exports: [
    TRANSACTION_REPOSITORY,
    CATEGORY_REPOSITORY,
    SUBCATEGORY_REPOSITORY,
    CREATE_TRANSACTION_UC,
    UPDATE_TRANSACTION_UC,
    DELETE_TRANSACTION_UC,
  ],
})
export class TransactionsModule {}
