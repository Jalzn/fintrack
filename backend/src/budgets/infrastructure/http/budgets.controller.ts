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
import type {
  BudgetDTO,
  CopyBudgetsFromPreviousMonthUseCase,
  CreateBudgetUseCase,
  DeleteBudgetUseCase,
  GetBudgetByIdUseCase,
  ListBudgetsUseCase,
  UpdateBudgetUseCase,
} from '@/budgets/application';
import {
  CopyBudgetsInputSchema,
  CreateBudgetInputSchema,
  DeleteBudgetInputSchema,
  GetBudgetByIdInputSchema,
  ListBudgetsInputSchema,
  UpdateBudgetInputSchema,
} from '@/budgets/application';
import { parseInput } from '@/shared/infrastructure';
import { CurrentUser } from '@/shared/infrastructure/auth/current-user.decorator';
import { JwtAuthGuard } from '@/shared/infrastructure/auth/jwt.guard';
import {
  COPY_BUDGETS_UC,
  CREATE_BUDGET_UC,
  DELETE_BUDGET_UC,
  GET_BUDGET_BY_ID_UC,
  LIST_BUDGETS_UC,
  UPDATE_BUDGET_UC,
} from '../tokens';

@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(
    @Inject(CREATE_BUDGET_UC) private readonly createBudget: CreateBudgetUseCase,
    @Inject(UPDATE_BUDGET_UC) private readonly updateBudget: UpdateBudgetUseCase,
    @Inject(GET_BUDGET_BY_ID_UC) private readonly getBudgetById: GetBudgetByIdUseCase,
    @Inject(LIST_BUDGETS_UC) private readonly listBudgets: ListBudgetsUseCase,
    @Inject(DELETE_BUDGET_UC) private readonly deleteBudget: DeleteBudgetUseCase,
    @Inject(COPY_BUDGETS_UC)
    private readonly copyBudgets: CopyBudgetsFromPreviousMonthUseCase,
  ) {}

  @Post()
  async create(@Body() body: unknown, @CurrentUser() userId: string): Promise<BudgetDTO> {
    return this.createBudget.execute(
      parseInput(CreateBudgetInputSchema, { ...(body as object), userId }),
    );
  }

  @Post('copy')
  async copy(@Body() body: unknown, @CurrentUser() userId: string): Promise<BudgetDTO[]> {
    return this.copyBudgets.execute(
      parseInput(CopyBudgetsInputSchema, { ...(body as object), userId }),
    );
  }

  @Get()
  async list(@Query() query: unknown, @CurrentUser() userId: string): Promise<BudgetDTO[]> {
    return this.listBudgets.execute(
      parseInput(ListBudgetsInputSchema, { ...(query as object), userId }),
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() userId: string,
  ): Promise<BudgetDTO> {
    return this.updateBudget.execute(
      parseInput(UpdateBudgetInputSchema, { ...(body as object), id, userId }),
    );
  }

  @Get(':id')
  async findOne(@Param() params: unknown, @CurrentUser() userId: string): Promise<BudgetDTO> {
    return this.getBudgetById.execute(
      parseInput(GetBudgetByIdInputSchema, { ...(params as object), userId }),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param() params: unknown, @CurrentUser() userId: string): Promise<void> {
    await this.deleteBudget.execute(
      parseInput(DeleteBudgetInputSchema, { ...(params as object), userId }),
    );
  }
}
