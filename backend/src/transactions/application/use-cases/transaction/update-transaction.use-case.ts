import type { IDomainEventDispatcher } from '@/shared/application';
import type { CurrencyCode } from '@/shared/domain';
import { currencyByCode, Money } from '@/shared/domain';
import {
  type ICategoryRepository,
  type ISubcategoryRepository,
  type ITransactionRepository,
  TransactionNotFoundError,
} from '@/transactions/domain';
import type { TransactionDTO } from '../../dtos';
import {
  InvalidCategoryReferenceError,
  InvalidSubcategoryReferenceError,
  SubcategoryCategoryMismatchError,
} from '../../errors';
import { toTransactionDTO } from '../../mappers';
import { type UpdateTransactionInput, UpdateTransactionInputSchema } from '../../schemas';

interface Deps {
  transactionRepository: ITransactionRepository;
  categoryRepository: ICategoryRepository;
  subcategoryRepository: ISubcategoryRepository;
  eventDispatcher: IDomainEventDispatcher;
}

export class UpdateTransactionUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateTransactionInput): Promise<TransactionDTO> {
    const parsed = UpdateTransactionInputSchema.parse(input);

    const transaction = await this.deps.transactionRepository.findById(parsed.id, parsed.userId);
    if (!transaction) throw new TransactionNotFoundError(parsed.id);

    if (parsed.categoryId) {
      const category = await this.deps.categoryRepository.findById(
        parsed.categoryId,
        parsed.userId,
      );
      if (!category) throw new InvalidCategoryReferenceError(parsed.categoryId);
    }

    const effectiveCategoryId = parsed.categoryId ?? transaction.categoryId;
    const categoryChanged =
      parsed.categoryId !== undefined && parsed.categoryId !== transaction.categoryId;

    let nextSubcategoryId: string | null | undefined;
    if (parsed.subcategoryId === null) {
      nextSubcategoryId = null;
    } else if (typeof parsed.subcategoryId === 'string') {
      const subcategory = await this.deps.subcategoryRepository.findById(
        parsed.subcategoryId,
        parsed.userId,
      );
      if (!subcategory) throw new InvalidSubcategoryReferenceError(parsed.subcategoryId);
      if (subcategory.categoryId !== effectiveCategoryId) {
        throw new SubcategoryCategoryMismatchError();
      }
      nextSubcategoryId = subcategory.id;
    } else if (categoryChanged && transaction.subcategoryId !== null) {
      throw new SubcategoryCategoryMismatchError(
        'Subcategory must be cleared or replaced when categoryId changes',
      );
    }

    let money: Money | undefined;
    if (parsed.amountMinorUnits !== undefined) {
      const existingCode = transaction.amount.toSnapshot().currency.code as CurrencyCode;
      money = Money.of(parsed.amountMinorUnits, currencyByCode[existingCode]);
    }

    transaction.update({
      ...(money !== undefined && { amount: money }),
      ...(parsed.categoryId !== undefined && { categoryId: parsed.categoryId }),
      ...(nextSubcategoryId !== undefined && { subcategoryId: nextSubcategoryId }),
      ...(parsed.description !== undefined && { description: parsed.description }),
      ...(parsed.date !== undefined && { date: parsed.date }),
    });

    await this.deps.transactionRepository.save(transaction);
    await this.deps.eventDispatcher.dispatch(transaction.domainEvents);
    transaction.clearDomainEvents();

    return toTransactionDTO(transaction);
  }
}
