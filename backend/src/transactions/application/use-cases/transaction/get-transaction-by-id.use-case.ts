import { type ITransactionRepository, TransactionNotFoundError } from '@/transactions/domain';
import type { TransactionDTO } from '../../dtos';
import { toTransactionDTO } from '../../mappers';
import { type GetTransactionByIdInput, GetTransactionByIdInputSchema } from '../../schemas';

interface Deps {
  transactionRepository: ITransactionRepository;
}

export class GetTransactionByIdUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetTransactionByIdInput): Promise<TransactionDTO> {
    const parsed = GetTransactionByIdInputSchema.parse(input);
    const transaction = await this.deps.transactionRepository.findById(parsed.id, parsed.userId);
    if (!transaction) throw new TransactionNotFoundError(parsed.id);
    return toTransactionDTO(transaction);
  }
}
