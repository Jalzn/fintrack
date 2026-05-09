import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { PaginatedResult } from '@/shared/application';
import { parseInput } from '@/shared/infrastructure';
import { CurrentUser } from '@/shared/infrastructure/auth/current-user.decorator';
import { JwtAuthGuard } from '@/shared/infrastructure/auth/jwt.guard';
import type {
  BalanceDTO,
  CalculateBalanceUseCase,
  CreateTransactionUseCase,
  DeleteTransactionUseCase,
  GetTransactionByIdUseCase,
  ListTransactionsUseCase,
  TransactionDTO,
  UpdateTransactionUseCase,
} from '@/transactions/application';
import {
  CalculateBalanceInputSchema,
  CreateTransactionInputSchema,
  DeleteTransactionInputSchema,
  GetTransactionByIdInputSchema,
  ListTransactionsInputSchema,
  UpdateTransactionInputSchema,
} from '@/transactions/application';
import {
  CALCULATE_BALANCE_UC,
  CREATE_TRANSACTION_UC,
  DELETE_TRANSACTION_UC,
  GET_TRANSACTION_BY_ID_UC,
  LIST_TRANSACTIONS_UC,
  UPDATE_TRANSACTION_UC,
} from '../tokens';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    @Inject(CREATE_TRANSACTION_UC) private readonly createTransaction: CreateTransactionUseCase,
    @Inject(UPDATE_TRANSACTION_UC) private readonly updateTransaction: UpdateTransactionUseCase,
    @Inject(GET_TRANSACTION_BY_ID_UC)
    private readonly getTransactionById: GetTransactionByIdUseCase,
    @Inject(LIST_TRANSACTIONS_UC) private readonly listTransactions: ListTransactionsUseCase,
    @Inject(DELETE_TRANSACTION_UC) private readonly deleteTransaction: DeleteTransactionUseCase,
    @Inject(CALCULATE_BALANCE_UC) private readonly calculateBalance: CalculateBalanceUseCase,
  ) {}

  @Post()
  async create(@Body() body: unknown, @CurrentUser() userId: string): Promise<TransactionDTO> {
    return this.createTransaction.execute(
      parseInput(CreateTransactionInputSchema, { ...(body as object), userId }),
    );
  }

  // /balance must come before /:id to avoid route conflict
  @Get('balance')
  async balance(@Query() query: unknown, @CurrentUser() userId: string): Promise<BalanceDTO> {
    return this.calculateBalance.execute(
      parseInput(CalculateBalanceInputSchema, { ...(query as object), userId }),
    );
  }

  @Get()
  async list(
    @Query() query: unknown,
    @CurrentUser() userId: string,
  ): Promise<PaginatedResult<TransactionDTO>> {
    return this.listTransactions.execute(
      parseInput(ListTransactionsInputSchema, { ...(query as object), userId }),
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() userId: string,
  ): Promise<TransactionDTO> {
    return this.updateTransaction.execute(
      parseInput(UpdateTransactionInputSchema, { ...(body as object), id, userId }),
    );
  }

  @Get(':id')
  async findOne(@Param() params: unknown, @CurrentUser() userId: string): Promise<TransactionDTO> {
    return this.getTransactionById.execute(
      parseInput(GetTransactionByIdInputSchema, { ...(params as object), userId }),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param() params: unknown, @CurrentUser() userId: string): Promise<void> {
    await this.deleteTransaction.execute(
      parseInput(DeleteTransactionInputSchema, { ...(params as object), userId }),
    );
  }
}
