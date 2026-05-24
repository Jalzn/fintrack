import { BudgetNotFoundError, type IBudgetRepository } from '@/budgets/domain';
import type { IDomainEventDispatcher } from '@/shared/application';
import { type CurrencyCode, currencyByCode, Money } from '@/shared/domain';
import type { ICategoryRepository, ISubcategoryRepository } from '@/transactions/domain';
import type { BudgetDTO } from '../../dtos';
import { resolveBudgetScopes } from '../../helpers/resolve-budget-scopes';
import { toBudgetDTO } from '../../mappers';
import { type UpdateBudgetInput, UpdateBudgetInputSchema } from '../../schemas';

interface Deps {
  budgetRepository: IBudgetRepository;
  categoryRepository: ICategoryRepository;
  subcategoryRepository: ISubcategoryRepository;
  eventDispatcher: IDomainEventDispatcher;
}

export class UpdateBudgetUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateBudgetInput): Promise<BudgetDTO> {
    const parsed = UpdateBudgetInputSchema.parse(input);

    const budget = await this.deps.budgetRepository.findById(parsed.id, parsed.userId);
    if (!budget) throw new BudgetNotFoundError(parsed.id);

    const scopes = await resolveBudgetScopes(this.deps, parsed.userId, parsed.scopes);
    const currencyCode = budget.currencyCode as CurrencyCode;

    budget.updateDetails({
      name: parsed.name,
      color: parsed.color,
      planned: Money.of(parsed.plannedMinorUnits, currencyByCode[currencyCode]),
      scopes,
    });

    await this.deps.budgetRepository.save(budget);
    await this.deps.eventDispatcher.dispatch(budget.domainEvents);
    budget.clearDomainEvents();

    return toBudgetDTO(budget);
  }
}
