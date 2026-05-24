import type { PinoLogger } from 'nestjs-pino';
import {
  type GroceryDepartment,
  GroceryItem,
  GroceryReceipt,
  type GroceryUnit,
  type IGroceryReceiptRepository,
  type IGrocerySettingsRepository,
} from '@/grocery-receipts/domain';
import type { IIdGenerator } from '@/shared/application';
import { currencyByCode, Money } from '@/shared/domain';
import type { CreateTransactionUseCase } from '@/transactions/application';
import { TransactionType } from '@/transactions/domain';
import type { GroceryReceiptDTO } from '../../dtos';
import { GrocerySettingsNotConfiguredError, ReceiptExtractionFailedError } from '../../errors';
import { toGroceryReceiptDTO } from '../../mappers';
import type { IReceiptExtractor } from '../../ports';
import { type ImportReceiptInput, ImportReceiptInputSchema } from '../../schemas';
import { reaisToMinorUnits } from './money.util';

interface Deps {
  groceryReceiptRepository: IGroceryReceiptRepository;
  grocerySettingsRepository: IGrocerySettingsRepository;
  receiptExtractor: IReceiptExtractor;
  createTransactionUseCase: CreateTransactionUseCase;
  idGenerator: IIdGenerator;
  logger?: PinoLogger;
}

export class ImportReceiptFromImageUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ImportReceiptInput): Promise<GroceryReceiptDTO> {
    const parsed = ImportReceiptInputSchema.parse(input);

    // Fail fast (before spending a Claude call) if the user hasn't chosen a destination.
    const settings = await this.deps.grocerySettingsRepository.findByUserId(parsed.userId);
    if (!settings) throw new GrocerySettingsNotConfiguredError();

    const extracted = await this.deps.receiptExtractor.extract({
      imageBase64: parsed.imageBase64,
      mimeType: parsed.mimeType,
    });

    if (extracted.totalReais === null) {
      throw new ReceiptExtractionFailedError('could not read the receipt total');
    }

    const currency = currencyByCode[extracted.currencyCode];
    const total = Money.of(reaisToMinorUnits(extracted.totalReais, currency), currency);
    if (!(total.toSnapshot().amount > 0)) {
      throw new ReceiptExtractionFailedError('receipt total must be greater than zero');
    }

    const receiptId = this.deps.idGenerator.generate();
    const storeName = extracted.storeName?.trim() || 'Mercado';
    const purchaseDate = parseReceiptDate(extracted.purchaseDate);

    const items = extracted.items.map((item) =>
      GroceryItem.create({
        id: this.deps.idGenerator.generate(),
        receiptId,
        rawDescription: item.rawDescription,
        normalizedName: item.normalizedName,
        quantity: item.quantity,
        unit: item.unit as GroceryUnit,
        unitPrice: Money.of(reaisToMinorUnits(item.unitPriceReais, currency), currency),
        lineTotal: Money.of(reaisToMinorUnits(item.lineTotalReais, currency), currency),
        brand: item.brand,
        code: item.code,
        department: item.department as GroceryDepartment,
        size: item.size,
      }),
    );

    const receipt = GroceryReceipt.create({
      id: receiptId,
      userId: parsed.userId,
      storeName,
      purchaseDate,
      total,
      items,
    });

    const transaction = await this.deps.createTransactionUseCase.execute({
      userId: parsed.userId,
      amountMinorUnits: total.toSnapshot().amount,
      currencyCode: extracted.currencyCode,
      type: TransactionType.EXPENSE,
      categoryId: settings.categoryId,
      subcategoryId: settings.subcategoryId,
      description: `Mercado - ${storeName}`,
      date: purchaseDate,
    });

    receipt.linkTransaction(transaction.id);
    await this.deps.groceryReceiptRepository.save(receipt);

    this.deps.logger?.info(
      { receiptId: receipt.id, userId: parsed.userId, transactionId: transaction.id },
      'Grocery receipt imported',
    );
    return toGroceryReceiptDTO(receipt);
  }
}

function parseReceiptDate(value: string | null): Date {
  if (value === null) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
