import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import type { IGroceryReceiptRepository } from '@/grocery-receipts/domain';
import { Money } from '@/shared/domain';
import type { TransactionUpdatedEvent } from '@/transactions/domain';
import { GROCERY_RECEIPT_REPOSITORY } from '../tokens';

/**
 * Reverse sync (transaction → receipt): when a transaction that backs a grocery receipt is
 * edited, mirror its date + amount onto the receipt. Listening to the event keeps `transactions`
 * unaware of `grocery-receipts` (no circular dependency), mirroring BudgetSpentRecalculatorHandler.
 */
@Injectable()
export class SyncReceiptOnTransactionUpdatedHandler {
  constructor(
    @Inject(GROCERY_RECEIPT_REPOSITORY)
    private readonly groceryReceiptRepository: IGroceryReceiptRepository,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {}

  @OnEvent('transaction.updated')
  async onUpdated(event: TransactionUpdatedEvent): Promise<void> {
    const { transactionId, userId, amount, date } = event.payload;
    const receipt = await this.groceryReceiptRepository.findByTransactionId(transactionId, userId);
    if (!receipt) return;

    const sameTotal = receipt.total.toSnapshot().amount === amount.amount;
    const sameDate = receipt.purchaseDate.getTime() === date.getTime();
    // Already aligned — also short-circuits the echo from the receipt→transaction forward sync.
    if (sameTotal && sameDate) return;

    try {
      receipt.update({
        total: Money.of(amount.amount, receipt.total.toSnapshot().currency),
        purchaseDate: date,
      });
      await this.groceryReceiptRepository.save(receipt);
    } catch (err) {
      this.logger.error({ err, transactionId }, 'Failed to sync grocery receipt from transaction');
    }
  }
}
