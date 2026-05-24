import type { PinoLogger } from 'nestjs-pino';
import { Budget, type IBudgetRepository } from '@/budgets/domain';
import type { IDomainEventDispatcher, IIdGenerator } from '@/shared/application';
import type { BudgetDTO } from '../../dtos';
import { toBudgetDTO } from '../../mappers';
import { type CopyBudgetsInput, CopyBudgetsInputSchema, periodToDate } from '../../schemas';

interface Deps {
  budgetRepository: IBudgetRepository;
  idGenerator: IIdGenerator;
  eventDispatcher: IDomainEventDispatcher;
  logger?: PinoLogger;
}

export class CopyBudgetsFromPreviousMonthUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CopyBudgetsInput): Promise<BudgetDTO[]> {
    const parsed = CopyBudgetsInputSchema.parse(input);

    const fromPeriod = periodToDate(parsed.fromPeriod);
    const toPeriod = periodToDate(parsed.toPeriod);

    const [source, destination] = await Promise.all([
      this.deps.budgetRepository.findByUserAndPeriod(parsed.userId, fromPeriod),
      this.deps.budgetRepository.findByUserAndPeriod(parsed.userId, toPeriod),
    ]);

    const existingKey = (b: { name: string; currencyCode: string }) =>
      `${b.name}|${b.currencyCode}`;
    const existing = new Set(destination.map((b) => existingKey(b)));

    const created: BudgetDTO[] = [];
    for (const src of source) {
      const key = existingKey(src);
      if (existing.has(key)) continue;

      const copy = Budget.create({
        id: this.deps.idGenerator.generate(),
        userId: src.userId,
        name: src.name,
        color: src.color,
        scopes: src.scopes.map((s) => ({ ...s })),
        periodStart: toPeriod,
        planned: src.planned,
      });
      await this.deps.budgetRepository.save(copy);
      await this.deps.eventDispatcher.dispatch(copy.domainEvents);
      copy.clearDomainEvents();
      created.push(toBudgetDTO(copy));
    }

    this.deps.logger?.info(
      {
        userId: parsed.userId,
        fromPeriod: parsed.fromPeriod,
        toPeriod: parsed.toPeriod,
        copied: created.length,
        skipped: source.length - created.length,
      },
      'Copied budgets from previous month',
    );

    return created;
  }
}
