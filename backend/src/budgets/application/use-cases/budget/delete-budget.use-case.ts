import { BudgetDeletedEvent, BudgetNotFoundError, type IBudgetRepository } from '@/budgets/domain';
import type { IDomainEventDispatcher } from '@/shared/application';
import { type DeleteBudgetInput, DeleteBudgetInputSchema } from '../../schemas';

interface Deps {
  budgetRepository: IBudgetRepository;
  eventDispatcher: IDomainEventDispatcher;
}

export class DeleteBudgetUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteBudgetInput): Promise<void> {
    const parsed = DeleteBudgetInputSchema.parse(input);
    const budget = await this.deps.budgetRepository.findById(parsed.id, parsed.userId);
    if (!budget) throw new BudgetNotFoundError(parsed.id);
    await this.deps.budgetRepository.delete(parsed.id, parsed.userId);
    await this.deps.eventDispatcher.dispatch([
      new BudgetDeletedEvent({ budgetId: parsed.id, userId: parsed.userId }),
    ]);
  }
}
