import type { PinoLogger } from 'nestjs-pino';
import {
  type GroceryDepartment,
  GroceryItem,
  GroceryReceiptNotFoundError,
  type GroceryUnit,
  type IGroceryReceiptRepository,
} from '@/grocery-receipts/domain';
import type { IIdGenerator } from '@/shared/application';
import { Money } from '@/shared/domain';
import type { UpdateTransactionUseCase } from '@/transactions/application';
import type { GroceryReceiptDTO } from '../../dtos';
import { toGroceryReceiptDTO } from '../../mappers';
import { type UpdateReceiptInput, UpdateReceiptInputSchema } from '../../schemas';

interface Deps {
  groceryReceiptRepository: IGroceryReceiptRepository;
  updateTransactionUseCase: UpdateTransactionUseCase;
  idGenerator: IIdGenerator;
  logger?: PinoLogger;
}

export class UpdateReceiptUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateReceiptInput): Promise<GroceryReceiptDTO> {
    const parsed = UpdateReceiptInputSchema.parse(input);

    const receipt = await this.deps.groceryReceiptRepository.findById(parsed.id, parsed.userId);
    if (!receipt) throw new GroceryReceiptNotFoundError(parsed.id);

    // Keep the receipt's original currency; the client only sends minor units.
    const currency = receipt.total.toSnapshot().currency;
    const total = Money.of(parsed.totalMinorUnits, currency);

    const items = parsed.items.map((item) =>
      GroceryItem.create({
        id: item.id ?? this.deps.idGenerator.generate(),
        receiptId: receipt.id,
        rawDescription: item.rawDescription?.trim() || item.normalizedName,
        normalizedName: item.normalizedName,
        quantity: item.quantity,
        unit: item.unit as GroceryUnit,
        unitPrice: Money.of(item.unitPriceMinorUnits, currency),
        lineTotal: Money.of(Math.round(item.quantity * item.unitPriceMinorUnits), currency),
        brand: item.brand ?? null,
        code: item.code ?? null,
        department: (item.department ?? null) as GroceryDepartment | null,
        size: item.size ?? null,
      }),
    );

    receipt.update({
      storeName: parsed.storeName,
      purchaseDate: parsed.purchaseDate,
      total,
      items,
    });

    await this.deps.groceryReceiptRepository.save(receipt);

    // Forward sync: keep the linked transaction's date + amount aligned with the receipt.
    if (receipt.transactionId !== null) {
      await this.deps.updateTransactionUseCase.execute({
        id: receipt.transactionId,
        userId: parsed.userId,
        amountMinorUnits: total.toSnapshot().amount,
        date: parsed.purchaseDate,
      });
    }

    this.deps.logger?.info(
      { receiptId: receipt.id, userId: parsed.userId, transactionId: receipt.transactionId },
      'Grocery receipt updated',
    );
    return toGroceryReceiptDTO(receipt);
  }
}
