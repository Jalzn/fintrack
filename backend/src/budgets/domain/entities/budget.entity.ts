import { AggregateRoot, Money } from '@/shared/domain';
import { InvalidBudgetError } from '../errors';
import { BudgetCreatedEvent, BudgetUpdatedEvent } from '../events';

/** A single category (optionally narrowed to one subcategory) tracked by a budget. */
export interface BudgetScope {
  categoryId: string;
  subcategoryId: string | null;
}

export interface CreateBudgetProps {
  id: string;
  userId: string;
  name: string;
  color: string;
  scopes: BudgetScope[];
  periodStart: Date;
  planned: Money;
  spent?: Money;
}

export interface BudgetProps extends CreateBudgetProps {
  spent: Money;
  createdAt: Date;
  updatedAt: Date;
}

const MAX_NAME_LENGTH = 80;

function normalizeScopes(scopes: BudgetScope[]): BudgetScope[] {
  return scopes.map((s) => ({ categoryId: s.categoryId, subcategoryId: s.subcategoryId ?? null }));
}

function scopeKey(s: BudgetScope): string {
  return `${s.categoryId}|${s.subcategoryId ?? '∅'}`;
}

interface ValidateProps {
  id: string;
  userId: string;
  name: string;
  color: string;
  scopes: BudgetScope[];
  periodStart: Date;
  planned: Money;
  spent: Money;
}

export class Budget extends AggregateRoot {
  private readonly _userId: string;
  private _name: string;
  private _color: string;
  private _scopes: BudgetScope[];
  private readonly _periodStart: Date;
  private _planned: Money;
  private _spent: Money;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: BudgetProps) {
    super(props.id);
    this._userId = props.userId;
    this._name = props.name;
    this._color = props.color;
    this._scopes = normalizeScopes(props.scopes);
    this._periodStart = props.periodStart;
    this._planned = props.planned;
    this._spent = props.spent;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  private static validate(props: ValidateProps): void {
    if (!props.id.trim()) {
      throw new InvalidBudgetError('Budget id must not be empty');
    }
    if (!props.userId.trim()) {
      throw new InvalidBudgetError('Budget userId must not be empty');
    }
    if (!props.name.trim()) {
      throw new InvalidBudgetError('Budget name must not be empty');
    }
    if (props.name.length > MAX_NAME_LENGTH) {
      throw new InvalidBudgetError(`Budget name must be at most ${MAX_NAME_LENGTH} characters`);
    }
    if (!props.color.trim()) {
      throw new InvalidBudgetError('Budget color must not be empty');
    }
    if (props.scopes.length === 0) {
      throw new InvalidBudgetError('Budget must have at least one scope');
    }
    const seen = new Set<string>();
    for (const scope of props.scopes) {
      if (!scope.categoryId.trim()) {
        throw new InvalidBudgetError('Budget scope categoryId must not be empty');
      }
      if (scope.subcategoryId !== null && !scope.subcategoryId.trim()) {
        throw new InvalidBudgetError('Budget scope subcategoryId must not be empty when provided');
      }
      const key = scopeKey(scope);
      if (seen.has(key)) {
        throw new InvalidBudgetError('Budget scopes must be unique');
      }
      seen.add(key);
    }
    if (Number.isNaN(props.periodStart.getTime())) {
      throw new InvalidBudgetError('Budget periodStart must be a valid date');
    }
    const isFirstOfMonthUtc =
      props.periodStart.getUTCDate() === 1 &&
      props.periodStart.getUTCHours() === 0 &&
      props.periodStart.getUTCMinutes() === 0 &&
      props.periodStart.getUTCSeconds() === 0 &&
      props.periodStart.getUTCMilliseconds() === 0;
    if (!isFirstOfMonthUtc) {
      throw new InvalidBudgetError(
        'Budget periodStart must be the first day of the month at 00:00:00 UTC',
      );
    }
    if (parseFloat(props.planned.toDecimal()) <= 0) {
      throw new InvalidBudgetError('Budget planned amount must be greater than zero');
    }
    if (parseFloat(props.spent.toDecimal()) < 0) {
      throw new InvalidBudgetError('Budget spent amount must not be negative');
    }
    const plannedCurrency = props.planned.toSnapshot().currency.code;
    const spentCurrency = props.spent.toSnapshot().currency.code;
    if (plannedCurrency !== spentCurrency) {
      throw new InvalidBudgetError('Budget planned and spent must share the same currency');
    }
  }

  static create(props: CreateBudgetProps): Budget {
    const now = new Date();
    const scopes = normalizeScopes(props.scopes);
    const spent =
      props.spent ??
      Money.fromSnapshot({ amount: 0, currency: props.planned.toSnapshot().currency });
    Budget.validate({
      id: props.id,
      userId: props.userId,
      name: props.name,
      color: props.color,
      scopes,
      periodStart: props.periodStart,
      planned: props.planned,
      spent,
    });
    const budget = new Budget({ ...props, scopes, spent, createdAt: now, updatedAt: now });
    budget.addDomainEvent(
      new BudgetCreatedEvent({
        budgetId: props.id,
        userId: props.userId,
        periodStart: props.periodStart,
        planned: props.planned.toSnapshot(),
      }),
    );
    return budget;
  }

  updateDetails(props: {
    name: string;
    color: string;
    planned: Money;
    scopes: BudgetScope[];
  }): void {
    const scopes = normalizeScopes(props.scopes);
    Budget.validate({
      id: this.id,
      userId: this._userId,
      name: props.name,
      color: props.color,
      scopes,
      periodStart: this._periodStart,
      planned: props.planned,
      spent: this._spent,
    });
    this._name = props.name;
    this._color = props.color;
    this._planned = props.planned;
    this._scopes = scopes;
    this._updatedAt = new Date();
    this.addDomainEvent(
      new BudgetUpdatedEvent({
        budgetId: this.id,
        userId: this._userId,
        planned: props.planned.toSnapshot(),
      }),
    );
  }

  /**
   * Updates the denormalized spent amount without emitting a domain event.
   * Called by the event handler that recomputes spent from transactions.
   */
  replaceSpent(spent: Money): void {
    Budget.validate({
      id: this.id,
      userId: this._userId,
      name: this._name,
      color: this._color,
      scopes: this._scopes,
      periodStart: this._periodStart,
      planned: this._planned,
      spent,
    });
    this._spent = spent;
    this._updatedAt = new Date();
  }

  static restore(props: BudgetProps): Budget {
    return new Budget(props);
  }

  get userId(): string {
    return this._userId;
  }
  get name(): string {
    return this._name;
  }
  get color(): string {
    return this._color;
  }
  get scopes(): readonly BudgetScope[] {
    return this._scopes.map((s) => ({ ...s }));
  }
  get periodStart(): Date {
    return this._periodStart;
  }
  get planned(): Money {
    return this._planned;
  }
  get spent(): Money {
    return this._spent;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get currencyCode(): string {
    return this._planned.toSnapshot().currency.code;
  }
}
