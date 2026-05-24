import type { PinoLogger } from 'nestjs-pino';
import { Budget, type IBudgetRepository } from '@/budgets/domain';
import type { IDomainEventDispatcher, IIdGenerator } from '@/shared/application';
import { currencyByCode, Money } from '@/shared/domain';
import type { ICategoryRepository, ISubcategoryRepository } from '@/transactions/domain';
import type { BudgetDTO } from '../../dtos';
import { resolveBudgetScopes } from '../../helpers/resolve-budget-scopes';
import { toBudgetDTO } from '../../mappers';
import { type CreateBudgetInput, CreateBudgetInputSchema, periodToDate } from '../../schemas';

interface Deps {
  budgetRepository: IBudgetRepository;
  categoryRepository: ICategoryRepository;
  subcategoryRepository: ISubcategoryRepository;
  idGenerator: IIdGenerator;
  eventDispatcher: IDomainEventDispatcher;
  logger?: PinoLogger;
}

export class CreateBudgetUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateBudgetInput): Promise<BudgetDTO> {
    const parsed = CreateBudgetInputSchema.parse(input);

    const scopes = await resolveBudgetScopes(this.deps, parsed.userId, parsed.scopes);
    const periodStart = periodToDate(parsed.period);
    const planned = Money.of(parsed.plannedMinorUnits, currencyByCode[parsed.currencyCode]);

    const budget = Budget.create({
      id: this.deps.idGenerator.generate(),
      userId: parsed.userId,
      name: parsed.name,
      color: parsed.color,
      scopes,
      periodStart,
      planned,
    });

    await this.deps.budgetRepository.save(budget);
    await this.deps.eventDispatcher.dispatch(budget.domainEvents);
    budget.clearDomainEvents();

    this.deps.logger?.info(
      { budgetId: budget.id, userId: parsed.userId, period: parsed.period },
      'Budget created',
    );
    return toBudgetDTO(budget);
  }
}
