import type { PaginatedResult } from '@/shared/application';
import type { ITransactionRepository } from '@/transactions/domain';
import type { TransactionDTO } from '../../dtos';
import { toTransactionDTO } from '../../mappers';
import { type ListTransactionsInput, ListTransactionsInputSchema } from '../../schemas';

interface Deps {
  transactionRepository: ITransactionRepository;
}

export class ListTransactionsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ListTransactionsInput): Promise<PaginatedResult<TransactionDTO>> {
    const parsed = ListTransactionsInputSchema.parse(input);

    const { data, total } = await this.deps.transactionRepository.findAll({
      userId: parsed.userId,
      page: parsed.page,
      limit: parsed.limit,
      ...(parsed.type !== undefined && { type: parsed.type }),
      ...(parsed.categoryId !== undefined && { categoryId: parsed.categoryId }),
      ...(parsed.subcategoryId !== undefined && { subcategoryId: parsed.subcategoryId }),
      ...(parsed.startDate !== undefined && { startDate: parsed.startDate }),
      ...(parsed.endDate !== undefined && { endDate: parsed.endDate }),
    });

    return {
      data: data.map(toTransactionDTO),
      total,
      page: parsed.page,
      limit: parsed.limit,
      totalPages: Math.ceil(total / parsed.limit),
    };
  }
}
