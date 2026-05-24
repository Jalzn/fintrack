import Anthropic from '@anthropic-ai/sdk';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { PinoLogger } from 'nestjs-pino';
import {
  AnalyzePricesUseCase,
  DeleteReceiptUseCase,
  GetGrocerySettingsUseCase,
  GetGrocerySummaryUseCase,
  GetReceiptByIdUseCase,
  ImportReceiptFromImageUseCase,
  type IReceiptExtractor,
  ListReceiptsUseCase,
  UpdateGrocerySettingsUseCase,
} from '@/grocery-receipts/application';
import type {
  IGroceryReceiptRepository,
  IGrocerySettingsRepository,
} from '@/grocery-receipts/domain';
import type { IIdGenerator } from '@/shared/application';
import { DRIZZLE_DB } from '@/shared/infrastructure/database/drizzle.tokens';
import { ID_GENERATOR } from '@/shared/infrastructure/shared.tokens';
import type {
  CreateTransactionUseCase,
  DeleteTransactionUseCase,
} from '@/transactions/application';
import type { ICategoryRepository, ISubcategoryRepository } from '@/transactions/domain';
import {
  CATEGORY_REPOSITORY,
  CREATE_TRANSACTION_UC,
  DELETE_TRANSACTION_UC,
  SUBCATEGORY_REPOSITORY,
} from '@/transactions/infrastructure/tokens';
import { TransactionsModule } from '@/transactions/infrastructure/transactions.module';
import { UsersModule } from '@/users/infrastructure/users.module';
import { GroceryReceiptsController } from './http/grocery-receipts.controller';
import {
  DrizzleGroceryReceiptRepository,
  DrizzleGrocerySettingsRepository,
} from './persistence/repository';
import { ClaudeReceiptExtractor } from './receipt-extractor';
import {
  ANALYZE_PRICES_UC,
  DELETE_RECEIPT_UC,
  GET_GROCERY_SETTINGS_UC,
  GET_GROCERY_SUMMARY_UC,
  GET_RECEIPT_BY_ID_UC,
  GROCERY_RECEIPT_REPOSITORY,
  GROCERY_SETTINGS_REPOSITORY,
  IMPORT_RECEIPT_UC,
  LIST_RECEIPTS_UC,
  RECEIPT_EXTRACTOR,
  UPDATE_GROCERY_SETTINGS_UC,
} from './tokens';

@Module({
  imports: [UsersModule, TransactionsModule],
  controllers: [GroceryReceiptsController],
  providers: [
    {
      provide: GROCERY_RECEIPT_REPOSITORY,
      useFactory: (db: PostgresJsDatabase) => new DrizzleGroceryReceiptRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: GROCERY_SETTINGS_REPOSITORY,
      useFactory: (db: PostgresJsDatabase) => new DrizzleGrocerySettingsRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: RECEIPT_EXTRACTOR,
      useFactory: (config: ConfigService, logger: PinoLogger) =>
        new ClaudeReceiptExtractor(
          new Anthropic({ apiKey: config.get<string>('ANTHROPIC_API_KEY') ?? 'missing' }),
          logger,
        ),
      inject: [ConfigService, PinoLogger],
    },
    {
      provide: IMPORT_RECEIPT_UC,
      useFactory: (
        groceryReceiptRepository: IGroceryReceiptRepository,
        grocerySettingsRepository: IGrocerySettingsRepository,
        receiptExtractor: IReceiptExtractor,
        createTransactionUseCase: CreateTransactionUseCase,
        idGenerator: IIdGenerator,
        logger: PinoLogger,
      ) =>
        new ImportReceiptFromImageUseCase({
          groceryReceiptRepository,
          grocerySettingsRepository,
          receiptExtractor,
          createTransactionUseCase,
          idGenerator,
          logger,
        }),
      inject: [
        GROCERY_RECEIPT_REPOSITORY,
        GROCERY_SETTINGS_REPOSITORY,
        RECEIPT_EXTRACTOR,
        CREATE_TRANSACTION_UC,
        ID_GENERATOR,
        PinoLogger,
      ],
    },
    {
      provide: LIST_RECEIPTS_UC,
      useFactory: (groceryReceiptRepository: IGroceryReceiptRepository) =>
        new ListReceiptsUseCase({ groceryReceiptRepository }),
      inject: [GROCERY_RECEIPT_REPOSITORY],
    },
    {
      provide: GET_RECEIPT_BY_ID_UC,
      useFactory: (groceryReceiptRepository: IGroceryReceiptRepository) =>
        new GetReceiptByIdUseCase({ groceryReceiptRepository }),
      inject: [GROCERY_RECEIPT_REPOSITORY],
    },
    {
      provide: DELETE_RECEIPT_UC,
      useFactory: (
        groceryReceiptRepository: IGroceryReceiptRepository,
        deleteTransactionUseCase: DeleteTransactionUseCase,
        logger: PinoLogger,
      ) => new DeleteReceiptUseCase({ groceryReceiptRepository, deleteTransactionUseCase, logger }),
      inject: [GROCERY_RECEIPT_REPOSITORY, DELETE_TRANSACTION_UC, PinoLogger],
    },
    {
      provide: ANALYZE_PRICES_UC,
      useFactory: (groceryReceiptRepository: IGroceryReceiptRepository) =>
        new AnalyzePricesUseCase({ groceryReceiptRepository }),
      inject: [GROCERY_RECEIPT_REPOSITORY],
    },
    {
      provide: GET_GROCERY_SUMMARY_UC,
      useFactory: (groceryReceiptRepository: IGroceryReceiptRepository) =>
        new GetGrocerySummaryUseCase({ groceryReceiptRepository }),
      inject: [GROCERY_RECEIPT_REPOSITORY],
    },
    {
      provide: GET_GROCERY_SETTINGS_UC,
      useFactory: (grocerySettingsRepository: IGrocerySettingsRepository) =>
        new GetGrocerySettingsUseCase({ grocerySettingsRepository }),
      inject: [GROCERY_SETTINGS_REPOSITORY],
    },
    {
      provide: UPDATE_GROCERY_SETTINGS_UC,
      useFactory: (
        grocerySettingsRepository: IGrocerySettingsRepository,
        categoryRepository: ICategoryRepository,
        subcategoryRepository: ISubcategoryRepository,
      ) =>
        new UpdateGrocerySettingsUseCase({
          grocerySettingsRepository,
          categoryRepository,
          subcategoryRepository,
        }),
      inject: [GROCERY_SETTINGS_REPOSITORY, CATEGORY_REPOSITORY, SUBCATEGORY_REPOSITORY],
    },
  ],
})
export class GroceryReceiptsModule {}
