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
  AnalyzePricesUseCase,
  DeleteReceiptUseCase,
  GetGrocerySettingsUseCase,
  GetGrocerySummaryUseCase,
  GetReceiptByIdUseCase,
  GroceryReceiptDTO,
  GrocerySettingsDTO,
  GrocerySummaryDTO,
  ImportReceiptFromImageUseCase,
  ListReceiptsUseCase,
  PriceAnalysisDTO,
  UpdateGrocerySettingsUseCase,
} from '@/grocery-receipts/application';
import {
  AnalyzePricesInputSchema,
  DeleteReceiptInputSchema,
  GetGrocerySettingsInputSchema,
  GetGrocerySummaryInputSchema,
  GetReceiptByIdInputSchema,
  ImportReceiptInputSchema,
  ListReceiptsInputSchema,
  UpdateGrocerySettingsInputSchema,
} from '@/grocery-receipts/application';
import type { PaginatedResult } from '@/shared/application';
import { parseInput } from '@/shared/infrastructure';
import { CurrentUser } from '@/shared/infrastructure/auth/current-user.decorator';
import { JwtAuthGuard } from '@/shared/infrastructure/auth/jwt.guard';
import {
  ANALYZE_PRICES_UC,
  DELETE_RECEIPT_UC,
  GET_GROCERY_SETTINGS_UC,
  GET_GROCERY_SUMMARY_UC,
  GET_RECEIPT_BY_ID_UC,
  IMPORT_RECEIPT_UC,
  LIST_RECEIPTS_UC,
  UPDATE_GROCERY_SETTINGS_UC,
} from '../tokens';

@UseGuards(JwtAuthGuard)
@Controller('grocery-receipts')
export class GroceryReceiptsController {
  constructor(
    @Inject(IMPORT_RECEIPT_UC) private readonly importReceipt: ImportReceiptFromImageUseCase,
    @Inject(LIST_RECEIPTS_UC) private readonly listReceipts: ListReceiptsUseCase,
    @Inject(GET_RECEIPT_BY_ID_UC) private readonly getReceiptById: GetReceiptByIdUseCase,
    @Inject(DELETE_RECEIPT_UC) private readonly deleteReceipt: DeleteReceiptUseCase,
    @Inject(ANALYZE_PRICES_UC) private readonly analyzePrices: AnalyzePricesUseCase,
    @Inject(GET_GROCERY_SUMMARY_UC) private readonly grocerySummary: GetGrocerySummaryUseCase,
    @Inject(GET_GROCERY_SETTINGS_UC) private readonly getSettings: GetGrocerySettingsUseCase,
    @Inject(UPDATE_GROCERY_SETTINGS_UC)
    private readonly updateSettings: UpdateGrocerySettingsUseCase,
  ) {}

  @Post()
  async import(@Body() body: unknown, @CurrentUser() userId: string): Promise<GroceryReceiptDTO> {
    return this.importReceipt.execute(
      parseInput(ImportReceiptInputSchema, { ...(body as object), userId }),
    );
  }

  @Get('settings')
  async settings(@CurrentUser() userId: string): Promise<{ settings: GrocerySettingsDTO | null }> {
    const settings = await this.getSettings.execute(
      parseInput(GetGrocerySettingsInputSchema, { userId }),
    );
    return { settings };
  }

  @Put('settings')
  async saveSettings(
    @Body() body: unknown,
    @CurrentUser() userId: string,
  ): Promise<GrocerySettingsDTO> {
    return this.updateSettings.execute(
      parseInput(UpdateGrocerySettingsInputSchema, { ...(body as object), userId }),
    );
  }

  @Get('price-analysis')
  async prices(@Query() query: unknown, @CurrentUser() userId: string): Promise<PriceAnalysisDTO> {
    return this.analyzePrices.execute(
      parseInput(AnalyzePricesInputSchema, { ...(query as object), userId }),
    );
  }

  @Get('summary')
  async summary(
    @Query() query: unknown,
    @CurrentUser() userId: string,
  ): Promise<GrocerySummaryDTO> {
    return this.grocerySummary.execute(
      parseInput(GetGrocerySummaryInputSchema, { ...(query as object), userId }),
    );
  }

  @Get()
  async list(
    @Query() query: unknown,
    @CurrentUser() userId: string,
  ): Promise<PaginatedResult<GroceryReceiptDTO>> {
    return this.listReceipts.execute(
      parseInput(ListReceiptsInputSchema, { ...(query as object), userId }),
    );
  }

  @Get(':id')
  async findOne(
    @Param() params: unknown,
    @CurrentUser() userId: string,
  ): Promise<GroceryReceiptDTO> {
    return this.getReceiptById.execute(
      parseInput(GetReceiptByIdInputSchema, { ...(params as object), userId }),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @CurrentUser() userId: string): Promise<void> {
    await this.deleteReceipt.execute(parseInput(DeleteReceiptInputSchema, { id, userId }));
  }
}
