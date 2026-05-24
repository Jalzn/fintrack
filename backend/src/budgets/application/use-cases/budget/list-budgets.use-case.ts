import type { IBudgetRepository } from '@/budgets/domain';
import type { BudgetDTO } from '../../dtos';
import { toBudgetDTO } from '../../mappers';
import { type ListBudgetsInput, ListBudgetsInputSchema, periodToDate } from '../../schemas';

interface Deps {
  budgetRepository: IBudgetRepository;
}

export class ListBudgetsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ListBudgetsInput): Promise<BudgetDTO[]> {
    const parsed = ListBudgetsInputSchema.parse(input);
    const periodStart = periodToDate(parsed.period);
    const budgets = await this.deps.budgetRepository.findByUserAndPeriod(
      parsed.userId,
      periodStart,
    );
    return budgets.map(toBudgetDTO);
  }
}
