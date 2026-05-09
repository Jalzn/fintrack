import { currencyByCode } from '@/shared/domain';
import type { BalanceCalculationService, ITransactionRepository } from '@/transactions/domain';
import type { BalanceDTO } from '../../dtos';
import { type CalculateBalanceInput, CalculateBalanceInputSchema } from '../../schemas';

interface Deps {
  transactionRepository: ITransactionRepository;
  balanceService: BalanceCalculationService;
}

export class CalculateBalanceUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CalculateBalanceInput): Promise<BalanceDTO> {
    const parsed = CalculateBalanceInputSchema.parse(input);
    const currency = currencyByCode[parsed.currencyCode];

    const { data: transactions } = await this.deps.transactionRepository.findAll({
      userId: parsed.userId,
      currencyCode: parsed.currencyCode,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
    });

    const { balance, income, expense } = this.deps.balanceService.calculate(
      transactions,
      currency,
    );
    return {
      balance: balance.toSnapshot(),
      income: income.toSnapshot(),
      expense: expense.toSnapshot(),
      startDate: parsed.startDate,
      endDate: parsed.endDate,
    };
  }
}
