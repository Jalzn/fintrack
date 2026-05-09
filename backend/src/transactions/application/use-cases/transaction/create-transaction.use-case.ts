import type { PinoLogger } from 'nestjs-pino';
import type { IDomainEventDispatcher, IIdGenerator } from '@/shared/application';
import { currencyByCode, Money } from '@/shared/domain';
import {
  type ICategoryRepository,
  type ISubcategoryRepository,
  type ITransactionRepository,
  Transaction,
} from '@/transactions/domain';
import type { TransactionDTO } from '../../dtos';
import {
  InvalidCategoryReferenceError,
  InvalidSubcategoryReferenceError,
  SubcategoryCategoryMismatchError,
} from '../../errors';
import { toTransactionDTO } from '../../mappers';
import { type CreateTransactionInput, CreateTransactionInputSchema } from '../../schemas';

interface Deps {
  transactionRepository: ITransactionRepository;
  categoryRepository: ICategoryRepository;
  subcategoryRepository: ISubcategoryRepository;
  idGenerator: IIdGenerator;
  eventDispatcher: IDomainEventDispatcher;
  logger?: PinoLogger;
}

export class CreateTransactionUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateTransactionInput): Promise<TransactionDTO> {
    const parsed = CreateTransactionInputSchema.parse(input);

    const category = await this.deps.categoryRepository.findById(parsed.categoryId, parsed.userId);
    if (!category) throw new InvalidCategoryReferenceError(parsed.categoryId);

    let subcategoryId: string | null = null;
    if (typeof parsed.subcategoryId === 'string') {
      const subcategory = await this.deps.subcategoryRepository.findById(
        parsed.subcategoryId,
        parsed.userId,
      );
      if (!subcategory) throw new InvalidSubcategoryReferenceError(parsed.subcategoryId);
      if (subcategory.categoryId !== parsed.categoryId) {
        throw new SubcategoryCategoryMismatchError();
      }
      subcategoryId = subcategory.id;
    }

    const id = this.deps.idGenerator.generate();
    const money = Money.of(parsed.amountMinorUnits, currencyByCode[parsed.currencyCode]);
    const transaction = Transaction.create({
      id,
      userId: parsed.userId,
      amount: money,
      type: parsed.type,
      categoryId: parsed.categoryId,
      subcategoryId,
      description: parsed.description,
      date: parsed.date,
    });

    await this.deps.transactionRepository.save(transaction);
    await this.deps.eventDispatcher.dispatch(transaction.domainEvents);
    transaction.clearDomainEvents();

    this.deps.logger?.info(
      { transactionId: transaction.id, userId: parsed.userId, type: parsed.type },
      'Transaction created',
    );
    return toTransactionDTO(transaction);
  }
}
