import { BudgetNotFoundError, type IBudgetRepository } from '@/budgets/domain';
import type { BudgetDTO } from '../../dtos';
import { toBudgetDTO } from '../../mappers';
import { type GetBudgetByIdInput, GetBudgetByIdInputSchema } from '../../schemas';

interface Deps {
  budgetRepository: IBudgetRepository;
}

export class GetBudgetByIdUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetBudgetByIdInput): Promise<BudgetDTO> {
    const parsed = GetBudgetByIdInputSchema.parse(input);
    const budget = await this.deps.budgetRepository.findById(parsed.id, parsed.userId);
    if (!budget) throw new BudgetNotFoundError(parsed.id);
    return toBudgetDTO(budget);
  }
}
