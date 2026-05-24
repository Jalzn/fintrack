import type { PinoLogger } from 'nestjs-pino';
import {
  GroceryReceiptNotFoundError,
  type IGroceryReceiptRepository,
} from '@/grocery-receipts/domain';
import type { DeleteTransactionUseCase } from '@/transactions/application';
import { TransactionNotFoundError } from '@/transactions/domain';
import { type DeleteReceiptInput, DeleteReceiptInputSchema } from '../../schemas';

interface Deps {
  groceryReceiptRepository: IGroceryReceiptRepository;
  deleteTransactionUseCase: DeleteTransactionUseCase;
  logger?: PinoLogger;
}

export class DeleteReceiptUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteReceiptInput): Promise<void> {
    const parsed = DeleteReceiptInputSchema.parse(input);
    const receipt = await this.deps.groceryReceiptRepository.findById(parsed.id, parsed.userId);
    if (!receipt) throw new GroceryReceiptNotFoundError(parsed.id);

    if (receipt.transactionId !== null) {
      try {
        await this.deps.deleteTransactionUseCase.execute({
          id: receipt.transactionId,
          userId: parsed.userId,
        });
      } catch (error) {
        if (!(error instanceof TransactionNotFoundError)) throw error;
        this.deps.logger?.warn(
          { receiptId: parsed.id, transactionId: receipt.transactionId },
          'Linked transaction already removed',
        );
      }
    }

    await this.deps.groceryReceiptRepository.delete(parsed.id, parsed.userId);
  }
}
