import type { PinoLogger } from 'nestjs-pino';
import type { IDomainEventDispatcher } from '@/shared/application';
import {
  type ITransactionRepository,
  TransactionDeletedEvent,
  TransactionNotFoundError,
} from '@/transactions/domain';
import { type DeleteTransactionInput, DeleteTransactionInputSchema } from '../../schemas';

interface Deps {
  transactionRepository: ITransactionRepository;
  eventDispatcher: IDomainEventDispatcher;
  logger?: PinoLogger;
}

export class DeleteTransactionUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteTransactionInput): Promise<void> {
    const parsed = DeleteTransactionInputSchema.parse(input);
    const transaction = await this.deps.transactionRepository.findById(parsed.id, parsed.userId);
    if (!transaction) throw new TransactionNotFoundError(parsed.id);
    await this.deps.transactionRepository.delete(parsed.id, parsed.userId);
    await this.deps.eventDispatcher.dispatch([
      new TransactionDeletedEvent({
        transactionId: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount.toSnapshot(),
        type: transaction.type,
        categoryId: transaction.categoryId,
        subcategoryId: transaction.subcategoryId,
        date: transaction.date,
        linkedTransactionId: transaction.linkedTransactionId,
      }),
    ]);
    this.deps.logger?.info(
      { transactionId: parsed.id, userId: parsed.userId },
      'Transaction deleted',
    );
  }
}
